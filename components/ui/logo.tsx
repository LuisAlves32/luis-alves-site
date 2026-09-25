// A LOGO, inline para pintar nítida e sem request (public/logo/logo-horizontal.svg).
// Mora aqui, e não dentro da navbar, porque duas peles a usam: a navbar do
// site, em Tinta sobre Papel, e o topo da landing do funil, em Papel sobre
// Tinta. O desenho escuro herda a cor do texto (currentColor), então quem
// escolhe é a classe de quem chama; a barra de acento fica no token da marca,
// porque ela é azul nas duas peles. Antes os dois valores eram hex solto.
//
// Tamanho: h-8 (32px de altura) nos dois lugares. É a régua da barra.
export function LogoHorizontal({className = ''}: {className?: string}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1500 360"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <polygon
        points="121.933,114.200 153.267,114.200 153.267,214.467 200.267,214.467 200.267,245.800 121.933,245.800"
        fill="currentColor"
      />
      <polygon
        points="189.300,245.800 223.767,245.800 269.200,114.200 234.733,114.200"
        fill="var(--cor-avanco)"
      />
      <path
        d="M136 0H1063V195H358V1490H136Z"
        fill="currentColor"
        transform="translate(350.000 218.000) scale(0.0615234 -0.0615234)"
      />
      <path
        d="M720 -24C1078 -24 1312 199 1312 510V1490H1091V528C1091 324 950 177 720 177C491 177 350 324 350 528V1490H129V510C129 199 362 -24 720 -24Z"
        fill="currentColor"
        transform="translate(418.353 218.000) scale(0.0615234 -0.0615234)"
      />
      <path
        d="M358 1490H136V0H358Z"
        fill="currentColor"
        transform="translate(508.115 218.000) scale(0.0615234 -0.0615234)"
      />
      <path
        d="M652 -24C990 -24 1209 152 1209 420C1209 633 1071 762 772 833L611 871C406 920 326 982 326 1090C326 1225 453 1320 633 1320C821 1320 943 1215 954 1044H1169C1160 1335 957 1514 636 1514C316 1514 105 1341 105 1079C105 873 237 748 538 677L701 638C908 589 987 523 987 408C987 263 854 170 652 170C429 170 298 286 297 483H75C75 168 295 -24 652 -24Z"
        fill="currentColor"
        transform="translate(540.107 218.000) scale(0.0615234 -0.0615234)"
      />
      <path
        d="M16 0H252L388 387H989L1121 0H1362L825 1490H557ZM455 576 548 840C589 963 632 1094 692 1287C751 1094 793 963 834 840L924 576Z"
        fill="currentColor"
        transform="translate(696.367 218.000) scale(0.0615234 -0.0615234)"
      />
      <path
        d="M136 0H1063V195H358V1490H136Z"
        fill="currentColor"
        transform="translate(780.593 218.000) scale(0.0615234 -0.0615234)"
      />
      <path
        d="M557 0H824L1357 1490H1122L835 650C799 542 754 398 694 202C632 398 586 542 550 650L255 1490H16Z"
        fill="currentColor"
        transform="translate(849.437 218.000) scale(0.0615234 -0.0615234)"
      />
      <path
        d="M136 0H1138V195H358V663H1080V856H358V1295H1138V1490H136Z"
        fill="currentColor"
        transform="translate(932.740 218.000) scale(0.0615234 -0.0615234)"
      />
      <path
        d="M652 -24C990 -24 1209 152 1209 420C1209 633 1071 762 772 833L611 871C406 920 326 982 326 1090C326 1225 453 1320 633 1320C821 1320 943 1215 954 1044H1169C1160 1335 957 1514 636 1514C316 1514 105 1341 105 1079C105 873 237 748 538 677L701 638C908 589 987 523 987 408C987 263 854 170 652 170C429 170 298 286 297 483H75C75 168 295 -24 652 -24Z"
        fill="currentColor"
        transform="translate(1008.291 218.000) scale(0.0615234 -0.0615234)"
      />
    </svg>
  );
}
