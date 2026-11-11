# Ofertasya

Loja com checkout PIX, etapas de identificação/entrega/pagamento, CEP e fretes.

## Vercel

Importe este repositório com o preset **Other**, comando de build `npm run build` e diretório de saída `public` (também definidos em vercel.json).

Em **Settings → Environment Variables**, configure `PINPAY_SECRET_KEY` como segredo em **Production** e `PINPAY_PUBLIC_KEY` como configuração, e faça um novo deploy. Nunca inclua a chave no HTML, Git ou variáveis com prefixo público.

`/api/health` informa a versão e se a variável está configurada, sem expor seu valor.

As rotas `/api/charge`, `/api/status/*`, `/api/qr/*` e `/api/cep/*` são executadas pela função Node da Vercel. O build publica apenas HTML, CSS, JavaScript e imagens da loja. A consulta do PIX e o QR Code utilizam tokens criptografados, permitindo continuar após reinícios das funções sem depender do disco efêmero da Vercel. Preserve as chaves enquanto houver PIX pendentes. A variável `URUSPAY_API_KEY` é mantida no servidor para validar os tokens existentes e consultar PIX anteriores à migração. Novas cobranças usam exclusivamente a PinPay; não há fallback de criação para a UrusPay. Os tokens de consulta expiram após sete dias. O painel PinPay mantém os novos pagamentos; esta versão não oferece um painel persistente de pedidos/endereço para expedição na Vercel.

## Local

    npm ci
    npm start

Copie `.env.example` para `.env` e configure a credencial local. Abra http://localhost:4180.

## Verificação

    npm test
    npm run build

Os testes usam respostas simuladas e não criam cobranças reais. O preço e o frete são calculados no servidor. O Pixel Purchase só dispara após confirmação e se o Pixel estiver instalado.

## Padrão para novas páginas de produto

Todas as páginas de produto devem importar `assets/ofertasya/store.js` e `store.css`, definir `body[data-product]` com o ID no catálogo e manter os componentes `.purchase`, `.option-head`, `#buy`, cores/tamanhos, galeria e sacola do modelo existente. O módulo compartilhado adiciona automaticamente o calculador de CEP, as opções de frete e a barra de compra no celular. Links de compra com `href="#produto"` são direcionados para a seleção e o botão de compra.

Preços e prazos de entrega ficam em `assets/ofertasya/shipping.mjs`, usado na página de produto, no checkout e no cálculo do servidor. Atualize essa fonte única para mudar as opções. A página de produto apenas exibe os fretes, sem seleção. O CEP é reaproveitado na mesma sessão; a escolha do frete ocorre somente no checkout; o checkout consulta novamente o endereço e exige sua conferência antes do pagamento.

Descrições introdutórias ficam na seção `#detalhes`, abaixo do título da seção, e não na área `.purchase`. O módulo compartilhado também move automaticamente `.purchase .intro` para os detalhes em novas páginas que usem o modelo antigo.

## PIX PinPay

Documentação: https://hub.usepinpay.com/documentacao . A API do servidor autentica com `PINPAY_SECRET_KEY`, envia valores em centavos para `POST /functions/v1/api-v1/pix` e consulta `GET /functions/v1/api-v1/pix/{id}`. Cada pedido usa `Idempotency-Key` estável e os campos obrigatórios `metadata.external_reference` e `metadata.checkout_url`. O código normaliza `paid`/`approved` para confirmação, confere o valor e mantém QR Code local, UTMify e Meta. A chave pública não é necessária para a chamada PIX server-side e não é inserida no HTML. Não coloque chaves reais nos testes.

Se a PinPay retornar `no_acquirer` (HTTP 422), selecione/habilite uma adquirente PIX na conta PinPay. A autenticação pode funcionar mesmo sem adquirente disponível. O checkout responde 503 sem culpar os dados do comprador; os logs guardam apenas o código e o status, sem chaves nem dados pessoais.
