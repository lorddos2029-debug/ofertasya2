# Ofertasya

Loja com checkout PIX e cartão, etapas de identificação/entrega/pagamento, CEP e fretes.

## Vercel

Importe este repositório com o preset **Other**, comando de build `npm run build` e diretório de saída `public` (também definidos em vercel.json).

Em **Settings → Environment Variables**, configure `BEEHIVE_SECRET_KEY` como segredo em **Production** e `BEEHIVE_PUBLIC_KEY` como configuração, e faça um novo deploy. Nunca inclua a chave no HTML, Git ou variáveis com prefixo público.

`/api/health` informa a versão e se a variável está configurada, sem expor seu valor.

As rotas `/api/card/charge`, `/api/payment-config`, `/api/beehive/webhook/*`, `/api/charge`, `/api/status/*`, `/api/qr/*` e `/api/cep/*` são executadas pela função Node da Vercel. O build publica apenas HTML, CSS, JavaScript e imagens da loja. A consulta do PIX e o QR Code utilizam tokens criptografados, permitindo continuar após reinícios das funções sem depender do disco efêmero da Vercel. Preserve as chaves enquanto houver PIX pendentes. A variável `URUSPAY_API_KEY` é mantida no servidor para validar os tokens existentes e consultar PIX anteriores à migração. Novas cobranças PIX e cartão usam exclusivamente a Beehive; não há fallback de criação para as credenciais anteriores. Os tokens de consulta expiram após sete dias. O painel Beehive mantém os novos pagamentos; esta versão não oferece um painel persistente de pedidos/endereço para expedição na Vercel.

## Local

    npm ci
    npm start

Copie `.env.example` para `.env` e configure a credencial local. Abra http://localhost:4180.

## Verificação

    npm test
    npm run build

Os testes usam respostas simuladas e não criam cobranças reais. O preço e o frete são calculados no servidor. Os eventos Meta IC e Purchase só disparam após confirmação e se o Pixel estiver instalado.

## Padrão para novas páginas de produto

Todas as páginas de produto devem importar `assets/ofertasya/store.js` e `store.css`, definir `body[data-product]` com o ID no catálogo e manter os componentes `.purchase`, `.option-head`, `#buy`, cores/tamanhos, galeria e sacola do modelo existente. O módulo compartilhado adiciona automaticamente o calculador de CEP, as opções de frete e a barra de compra no celular. Links de compra com `href="#produto"` são direcionados para a seleção e o botão de compra.

Preços e prazos de entrega ficam em `assets/ofertasya/shipping.mjs`, usado na página de produto, no checkout e no cálculo do servidor. Atualize essa fonte única para mudar as opções. A página de produto apenas exibe os fretes, sem seleção. O CEP é reaproveitado na mesma sessão; a escolha do frete ocorre somente no checkout; o checkout consulta novamente o endereço e exige sua conferência antes do pagamento.

Descrições introdutórias ficam na seção `#detalhes`, abaixo do título da seção, e não na área `.purchase`. O módulo compartilhado também move automaticamente `.purchase .intro` para os detalhes em novas páginas que usem o modelo antigo.

## PIX e cartão Beehive

Documentação: https://docs.beehivehub.io/authentication e https://docs.beehivehub.io/api-reference/transactions/create-transaction . A API utiliza Basic Auth com a chave secreta no servidor e valores em centavos. Cada cobrança inclui cliente com telefone obrigatório e DDD, itens, endereço, metadados, referência externa estável e postback de confirmação. A Beehive pode retornar HTTP 424 com uma mensagem JSON aninhada para validações da adquirente; o status isolado não identifica ausência de adquirente.

Cartões são tokenizados exclusivamente no navegador pelo SDK oficial, com 3DS quando disponível. Somente o hash temporário e o número de parcelas chegam ao servidor; número, validade e CVV não fazem parte do payload da loja nem dos tokens de consulta. O cartão usa o preço integral; o desconto de 5% aplica-se apenas ao PIX nos produtos elegíveis.

O webhook utiliza contexto criptografado e consulta a transação autenticada antes de aceitar ID, referência do pedido, método e valor. Somente o status paid confirma o pedido: authorized/processing continuam pendentes. A confirmação atualiza UTMify e Meta, com IDs de evento estáveis para deduplicação. O QR Code é gerado localmente a partir do código retornado pela Beehive. Não coloque credenciais reais nos testes.
