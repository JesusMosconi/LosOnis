export const isAdmin=(session:{role:string}|null)=>session?.role==="ADMIN";
