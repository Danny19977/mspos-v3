export interface IPermission {
    name: string;
    desc: string;
}

export const permissions: IPermission[] = [
    { name: 'ALL', desc: 'View Add Edit Delete'},
    { name: 'VAE', desc: 'View Add Edit'},
    { name: 'VED', desc: 'View Edit Delete'},
    { name: 'VE', desc: 'View Edit'},
    { name: 'VA', desc: 'View Add'},
    { name: 'V', desc: 'View'},
]
 