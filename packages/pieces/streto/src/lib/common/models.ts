type Catalog = {
  id: string;
  [propName: string]: any;
};

type Product = {
  id: string;
  attributes: {
    sku: string;
    mvb_cost: string;
    mvb_source_rule: string;
    [propName: string]: any;
  };
  [propName: string]: any;
};

type Rule = {
  row: string;
  values: {
    A?: string;
    B?: string;
    C?: string;
    D?: string;
    E?: string;
    F?: string;
    G?: string;
  };
};
