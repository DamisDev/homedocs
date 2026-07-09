# @homedocs/shared-types

Tipi TypeScript condivisi (DTO) tra `apps/frontend` e `apps/backend`. Sono il **contratto REST** tra i due: se un DTO cambia, va cambiato qui, mai duplicato localmente.

## Regole

- **Solo tipi**: interfacce e union di stringhe letterali. Niente enum, classi, costanti o altro codice runtime — il pacchetto viene consumato via path alias TypeScript (`@homedocs/shared-types`) e non viene compilato/pubblicato, quindi qualsiasi valore runtime romperebbe il backend a runtime.
- Importare sempre con `import type { ... } from '@homedocs/shared-types'`.
- Gli ID (`ObjectId` Mongo) e le date viaggiano come `string` sul filo (JSON): qui si modella il payload REST, non il documento Mongo. Gli schemi Mongoose vivono nel backend.
- La validazione input (`class-validator`) resta nel backend: le classi DTO NestJS devono `implements` l'interfaccia condivisa corrispondente, così un disallineamento diventa un errore di compilazione.
