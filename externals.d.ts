declare module '*.less' {
  const resource: {[key: string]: string};
  export = resource;
}
declare module '*.md' {
  const content: string;
  export = content;
}
