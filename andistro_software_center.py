#!/usr/bin/env python3
import json
import os
import subprocess
import shlex
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask("AnDistro Software Center")
# CORS liberado somente para o front em GitHub Pages
CORS(app, origins=["https://andistro.github.io"])

PORT = 27777
ICON_SIZE = "64x64"


def run_cmd(cmd):
    proc = subprocess.run(
        cmd,
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    return proc.returncode, proc.stdout, proc.stderr


@app.get("/ping")
def ping():
    return jsonify({
        "status": "ok",
        "distro": "AnDistro",
        "arch": os.uname().machine
    })


# ---------------- LISTA INSTALADOS ----------------

def parse_installed():
    cmd = r"dpkg-query -W -f='${Package}\t${Status}\n'"
    code, out, err = run_cmd(cmd)
    if code != 0:
        raise RuntimeError(err)

    apps = []
    addons = []

    for line in out.splitlines():
        try:
            name, status = line.split("\t", 1)
        except ValueError:
            continue
        if "installed" not in status:
            continue

        lower = name.lower()
        entry = {
            "nome_programa": name,
            "nome_pacote": name,
            "tipo": "app",
        }
        if any(suf in lower for suf in [
            "-lang", "-l10n", "-help", "-doc", "-data",
            "-plugin", "-addon", "-extensions"
        ]):
            entry["tipo"] = "addon"
            addons.append(entry)
        else:
            apps.append(entry)

    return {"apps": apps, "addons": addons}


@app.get("/installed")
def installed():
    try:
        dados = parse_installed()
        return jsonify(dados)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.get("/installed-names")
def installed_names():
    """
    Retorna apenas os nomes dos pacotes instalados.
    Formato: { "packages": ["bleachbit", "firefox-esr", ...] }
    """
    try:
        dados = parse_installed()
        apps = dados.get("apps", [])
        addons = dados.get("addons", [])
        names = sorted({p["nome_pacote"] for p in (apps + addons)})
        return jsonify({"packages": names})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------------- LISTA ATUALIZAÇÕES ----------------

def parse_updates():
    cmd = r"apt list --upgradable 2>/dev/null | tail -n +2"
    code, out, err = run_cmd(cmd)
    if code != 0 and not out:
        raise RuntimeError(err)

    updates = []
    for line in out.splitlines():
        name = line.split("/", 1)[0]
        updates.append({
            "nome_programa": name,
            "nome_pacote": name,
        })
    return updates


@app.get("/updates")
def updates():
    try:
        dados = parse_updates()
        return jsonify({"updates": dados})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------------- SEARCH (APT) ----------------

def search_packages(term):
    """
    Usa apt-cache search para buscar em todos os repositórios
    e ordena priorizando pacotes cujo nome começa com o termo.
    """
    term = (term or "").strip()
    if not term:
        return []

    cmd = f"apt-cache search {shlex.quote(term)}"
    code, out, err = run_cmd(cmd)
    if code != 0 and not out:
        raise RuntimeError(err)

    resultados = []
    for line in out.splitlines():
        if " - " not in line:
            continue
        name, desc = line.split(" - ", 1)
        name = name.strip()
        desc = desc.strip()
        if not name:
            continue
        resultados.append({
            "nome_pacote": name,
            "descricao": desc
        })

    termo = term.lower()

    def sort_key(pkg):
        nome = pkg["nome_pacote"].lower()
        desc = (pkg.get("descricao") or "").lower()

        # 0: nome é exatamente o termo ou começa com "<termo>-"
        if nome == termo or nome.startswith(termo + "-"):
            return (0, nome)

        # 1: termo em qualquer lugar do nome
        if termo in nome:
            return (1, nome)

        # 2: termo só na descrição
        if termo in desc:
            return (2, nome)

        # 3: resto
        return (3, nome)

    resultados.sort(key=sort_key)
    return resultados


@app.get("/search")
def search():
    q = request.args.get("q", "").strip()
    if not q:
        return jsonify({"results": []})
    try:
        dados = search_packages(q)
        return jsonify({"results": dados})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------------- ICONE ----------------

def find_icon_for_package(pkg_name):
    candidates = []

    icon_dirs = [
        Path("/usr/share/icons"),
        Path("/usr/share/pixmaps"),
    ]
    base_names = [
        pkg_name,
        pkg_name + ".svg",
        pkg_name + ".png",
    ]

    for base_dir in icon_dirs:
        if not base_dir.exists():
            continue
        for root, dirs, files in os.walk(base_dir):
            for f in files:
                lf = f.lower()
                for bn in base_names:
                    if lf == bn.lower():
                        candidates.append(str(Path(root) / f))
                if lf.startswith(pkg_name.lower()):
                    candidates.append(str(Path(root) / f))

    return candidates[0] if candidates else None


@app.get("/icon")
def icon():
    pkg = request.args.get("pkg", "").strip()
    if not pkg:
        return jsonify({"error": "missing pkg"}), 400

    path = find_icon_for_package(pkg)
    if not path:
        return jsonify({"found": False}), 404

    return jsonify({"found": True, "path": path})


# ---------------- ABRIR APLICATIVO ----------------

def guess_exec_from_package(pkg_name: str):
    """
    Heurística simples: tenta descobrir o comando a partir do nome do pacote.
    Ajuste estes casos especiais conforme necessário.
    """
    pkg = (pkg_name or "").lower()

    # casos especiais conhecidos
    if pkg in ("bleachbit", "bleachbit-root"):
        return "bleachbit"

    # exemplos a estender:
    # if pkg in ("firefox-esr", "firefox"):
    #     return "firefox-esr"
    # if pkg in ("chromium", "chromium-browser"):
    #     return "chromium"

    # fallback: tentar o próprio nome do pacote
    return pkg_name


@app.post("/open")
def open_app():
    data = request.get_json(silent=True) or {}
    pkg = (data.get("pkg") or "").strip()
    if not pkg:
        return jsonify({"error": "missing pkg"}), 400

    cmd = guess_exec_from_package(pkg)

    try:
        subprocess.Popen(
            [cmd],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        return jsonify({"ok": True, "cmd": cmd})
    except Exception as e:
        return jsonify({"ok": False, "cmd": cmd, "error": str(e)}), 500


# ---------------- INSTALAR / REMOVER ----------------

@app.post("/install")
def install():
    data = request.get_json(silent=True) or {}
    pkg = data.get("pkg", "").strip()
    if not pkg:
        return jsonify({"error": "missing pkg"}), 400

    # IMPORTANTE: requer root / sudo devidamente configurado.
    cmd = f"apt-get install -y {pkg!s}"
    code, out, err = run_cmd(cmd)

    return jsonify({
        "pkg": pkg,
        "code": code,
        "stdout": out,
        "stderr": err,
    }), (200 if code == 0 else 500)


@app.post("/remove")
def remove():
    data = request.get_json(silent=True) or {}
    pkg = data.get("pkg", "").strip()
    if not pkg:
        return jsonify({"error": "missing pkg"}), 400

    # IMPORTANTE: também requer root / sudo configurado.
    cmd = f"apt-get remove -y {pkg!s}"
    code, out, err = run_cmd(cmd)

    return jsonify({
        "pkg": pkg,
        "code": code,
        "stdout": out,
        "stderr": err,
    }), (200 if code == 0 else 500)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=PORT)
