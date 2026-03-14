import os
import re
import subprocess
import tempfile
import shutil

# Mapeamento: HTML de entrada -> HTML de saída (pasta destino)
tarefas = {
    "src/index.html":    "src/tela.html",

}

def obfuscar_js(codigo_js: str) -> str:
    """Salva o JS num arquivo temporário, obfusca, e retorna o resultado."""
    with tempfile.NamedTemporaryFile(suffix=".js", mode="w", encoding="utf-8", delete=False) as tmp_in:
        tmp_in.write(codigo_js)
        tmp_in_path = tmp_in.name

    tmp_out_path = tmp_in_path.replace(".js", "_obf.js")

    comando = [
        "javascript-obfuscator",
        tmp_in_path,
        "--output", tmp_out_path,
        "--compact", "true",
        "--self-defending", "false",
        "--string-array", "true",
        "--string-array-rotate", "true",
        "--string-array-threshold", "0.75",
        "--control-flow-flattening", "false",
        "--dead-code-injection", "true",
        "--unicode-escape-sequence", "true",
    ]

    try:
        subprocess.run(comando, check=True, capture_output=True)
        with open(tmp_out_path, "r", encoding="utf-8") as f:
            resultado = f.read()
        return resultado
    finally:
        os.unlink(tmp_in_path)
        if os.path.exists(tmp_out_path):
            os.unlink(tmp_out_path)


def processar_html(caminho_entrada: str, caminho_saida: str):
    with open(caminho_entrada, "r", encoding="utf-8") as f:
        html = f.read()

    # Encontra todos os blocos <script> inline (sem atributo src)
    # Captura: prefixo da tag <script ...>, conteúdo JS, sufixo </script>
    padrao = re.compile(
        r'(<script(?![^>]*\bsrc\b)[^>]*>)(.*?)(</script>)',
        re.DOTALL | re.IGNORECASE
    )

    blocos_encontrados = padrao.findall(html)
    if not blocos_encontrados:
        print(f"  ⚠️  Nenhum <script> inline encontrado em {caminho_entrada}")
        return

    print(f"  📝 {len(blocos_encontrados)} bloco(s) de script encontrado(s)")

    contador = [0]  # usa lista para poder modificar dentro do lambda

    def substituir(m):
        abertura = m.group(1)
        js_original = m.group(2)
        fechamento = m.group(3)

        # Pula blocos vazios ou só com espaços
        if not js_original.strip():
            return m.group(0)

        contador[0] += 1
        print(f"    🔒 Obfuscando bloco {contador[0]} ({len(js_original)} chars)...")
        js_obfuscado = obfuscar_js(js_original)
        print(f"    ✅ Bloco {contador[0]} protegido ({len(js_obfuscado)} chars)")
        return abertura + "\n" + js_obfuscado + "\n" + fechamento

    html_final = padrao.sub(substituir, html)

    os.makedirs(os.path.dirname(caminho_saida) or ".", exist_ok=True)
    with open(caminho_saida, "w", encoding="utf-8") as f:
        f.write(html_final)

    print(f"  💾 Salvo em: {caminho_saida}\n")


def build():
    print("🚀 Iniciando proteção de código...\n")

    # Verifica se o obfuscador está instalado
    if not shutil.which("javascript-obfuscator"):
        print("❌ 'javascript-obfuscator' não encontrado.")
        print("   Instale com: npm install -g javascript-obfuscator")
        return

    for entrada, saida in tarefas.items():
        if not os.path.exists(entrada):
            print(f"⚠️  Arquivo não encontrado: {entrada}")
            continue

        print(f"📄 Processando: {entrada}")
        try:
            processar_html(entrada, saida)
        except Exception as e:
            print(f"❌ Erro ao processar {entrada}: {e}\n")

    print("🏁 Build concluído!")


if __name__ == "__main__":
    build()
