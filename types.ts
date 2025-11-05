export interface Item {
  id: string;
  content: string;
}

export interface Column {
  id: string;
  title: string;
  color: string;
  items: Item[];
  meaning: string;
  strategy: string;
}
