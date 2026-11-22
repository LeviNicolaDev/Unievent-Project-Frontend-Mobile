# Unievent Mobile

Aplicativo React Native com Expo para alunos. Instale com `npm ci` e execute
`npm start` (offline) ou `npm run start:online`.

## Eventos de demonstração (M3)

Sem token ou quando a sincronização falha, o catálogo exibe somente exemplos de
`src/data/events.js`, identificados como Demonstração. Seus IDs usam `demo:` e
não permitem inscrição, ingresso ou certificado real. Falhas exibem mensagem e
opção de tentar novamente. Respostas vazias da API permanecem vazias.

## Cadastro e confirmação de e-mail (M4)

O cadastro mobile em `SignUpScreen.js` é institucional: exige endereço
`@fatec.sp.gov.br` ou `@aluno.cps.sp.gov.br`, instituição e confirmação de e-mail antes do login.
Usa `POST /Aluno` e `POST /Auth/login-aluno`.

Conforme o contrato informado na revisão, o cadastro externo em
`AuthService.CadastrarPublicoGeral` define `EmailConfirmado = true`, sem confirmação
adicional obrigatória. Esse fluxo externo não está implementado nesta tela.
Não aplicar a ele as instruções do cadastro institucional.

## Pendências no repositório da API (M1 e M2)

Este repositório não contém os 78 arquivos `.puml`, o Documento de Casos de Uso,
`ParticipacaoService.cs` ou `AuthService.cs` citados na revisão.

- M1: exportar SVG/PNG ao lado dos `.puml` e atualizar índices e links no repositório
  da API, verificando a visualização normal do Markdown.
- M2: corrigir `docs/diagramas-sequencia/04_inscricao_e_ingresso_mobile.puml`:
  participação inexistente resulta em 404/falha; participação cancelada retorna
  ingresso com `StatusInscricao = Cancelada`, sem permitir check-in.

Os contratos acima foram fornecidos na revisão e precisam ser conferidos no
código da API ao atualizar seus diagramas.
