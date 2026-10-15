# Ofertasya

Loja estática responsiva para o Bettdow Smartwatch com GPS e chamadas Bluetooth.

## Executar localmente

Requer Node.js. Não há dependências para instalar.

```sh
node server.mjs
```

Abra http://localhost:4180.

## Arquivos

- `index.html`: página do produto, descrição e perguntas frequentes.
- `assets/ofertasya/store.css`: identidade visual e layout responsivo.
- `assets/ofertasya/store.js`: galeria, variantes, favoritos e sacola local.
- `assets/ofertasya/watch-*.png`: imagens fornecidas do produto.
- `assets/ofertasya/ofertasya-logo.png` e `.svg`: logo.
- `checkout.html`: aviso sobre a integração de pagamento pendente.

A sacola e os favoritos são armazenados no navegador. Avaliações têm apenas prévia local. Pagamentos, pedidos e publicação de avaliações ainda precisam de backend. Os caminhos de assets partem da raiz do domínio.
