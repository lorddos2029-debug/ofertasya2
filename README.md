# Ofertasya

Loja com checkout PIX, etapas de identificação/entrega/pagamento, CEP e fretes.

## Vercel

Importe este repositório com o preset **Other**, comando de build `npm run build` e diretório de saída `public` (também definidos em vercel.json).

Em **Settings → Environment Variables**, crie `URUSPAY_API_KEY` com sua chave UrusPay, marque **Production** e **Preview**, e faça um novo deploy. Nunca inclua a chave no HTML, Git ou variáveis com prefixo público.

`/api/health` informa a versão e se a variável está configurada, sem expor seu valor.

As rotas `/api/charge`, `/api/status/*`, `/api/qr/*` e `/api/cep/*` são executadas pela função Node da Vercel. O build publica apenas HTML, CSS, JavaScript e imagens da loja. A consulta do PIX e o QR Code utilizam tokens criptografados, permitindo continuar após reinícios das funções sem depender do disco efêmero da Vercel. Preserve a chave enquanto houver PIX pendentes. Os tokens de consulta expiram após sete dias. O painel UrusPay mantém os pagamentos; esta versão não oferece um painel persistente de pedidos/endereço para expedição na Vercel.

## Local

    npm ci
    npm start

Copie `.env.example` para `.env` e configure a credencial local. Abra http://localhost:4180.

## Verificação

    npm test
    npm run build

Os testes usam respostas simuladas e não criam cobranças reais. O preço e o frete são calculados no servidor. O Pixel Purchase só dispara após confirmação e se o Pixel estiver instalado.
