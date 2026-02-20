import type { Step } from 'react-joyride';

export const productsSteps: Step[] = [
  {
    target: 'body',
    placement: 'center',
    title: 'Produtos e Serviços',
    content: 'Cadastre aqui tudo o que você pode vender além do aluguel da lancha (Ex: Bebidas, Churrasco, Marinheiro particular).',
  },
  {
    target: '[data-tour="btn-add-product"]',
    title: 'Novo Produto',
    content: 'Clique aqui para cadastrar um novo item. Você poderá definir o preço de venda e também o custo operacional para o cálculo de lucro.',
  },
  {
    target: '[data-tour="products-list"]',
    title: 'Seus Produtos',
    content: 'Aqui aparecem todos os itens cadastrados. Você pode ver o preço e se ele é oferecido como cortesia por padrão.',
  },
  {
    target: '[data-tour="btn-edit-product"]',
    title: 'Editar ou Excluir',
    content: 'Precisa atualizar um preço ou remover um produto? Use estes botões.',
  }
];
