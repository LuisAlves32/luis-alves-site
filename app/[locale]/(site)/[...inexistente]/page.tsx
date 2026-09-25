import {notFound} from 'next/navigation';

// Qualquer caminho que nenhuma rota conheça cai aqui e rende a 404 da marca
// (not-found.tsx deste grupo), com o chrome do site.
export default function PaginaInexistente() {
  notFound();
}
