# software-center
Central de aplicativos AnDistro
Site criado para funcionar dentro do Debian do AnDistro para procurar e instalar aplicativos


# Daemon para o Software-center funcionar no AnDistro
```text
~/.andistro-software-center/
├── bin/              # venv (python, pip, etc.)
└── app/
    └── andistro_software_center.py
```

## Criar a estrutura

```shell
# criar pasta do projeto
mkdir -p ~/.andistro-software-center/app
cd ~/.andistro-software-center
```

## Criar ambiente virtual e instalar dependências
```shell
apt update
apt install -y python3 python3-venv python3-pip


cd ~/.andistro-software-center

# criar venv
python3 -m venv .

# ativar (opcional, já vamos usar o bin/ direto)
ls

# instalar Flask e Flask-CORS na venv
~/.andistro-software-center/bin/pip install flask flask-cors

```

## Baixar o `andistro_software_center.py`
```shell
cd ~/.andistro-software-center/app

# exemplo usando curl (ajuste a URL do seu repositório)
curl -o andistro_software_center.py https://raw.githubusercontent.com/andistro/software-center/refs/heads/main/andistro_software_center.py

chmod +x andistro_software_center.py

```

## Iniciar
```shell
~/.andistro-software-center/bin/python  ~/.andistro-software-center/app/andistro_software_center.py &

```

O terminal deve mostrar algo como
```shell
* Serving Flask app 'AnDistro Software Center'
* Debug mode: off
* Running on http://127.0.0.1:27777
Press CTRL+C to quit

```
