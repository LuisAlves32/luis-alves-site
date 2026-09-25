// Campos de formulário do design.md: label ACIMA, raio 8px, borda lápis,
// fundo branco, altura de toque 52px. Nunca placeholder no lugar de label.
export const estiloCampo =
  'h-13 w-full rounded-[8px] border border-lapis bg-white px-4 text-[15px] text-grafite';

const estiloRotulo = 'mb-2 block text-sm font-medium text-tinta';

export function Campo({
  id,
  name,
  rotulo,
  tipo = 'text',
  obrigatorio = false,
  autoComplete,
  className = ''
}: {
  id: string;
  name: string;
  rotulo: string;
  tipo?: string;
  obrigatorio?: boolean;
  autoComplete?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className={estiloRotulo}>
        {rotulo}
      </label>
      <input
        id={id}
        name={name}
        type={tipo}
        required={obrigatorio}
        autoComplete={autoComplete}
        className={estiloCampo}
      />
    </div>
  );
}

export function CampoArea({
  id,
  name,
  rotulo,
  className = ''
}: {
  id: string;
  name: string;
  rotulo: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className={estiloRotulo}>
        {rotulo}
      </label>
      <textarea
        id={id}
        name={name}
        rows={4}
        className={`${estiloCampo} h-auto min-h-28 py-3`}
      />
    </div>
  );
}

/**
 * As opções vêm em PARES, e não como uma lista de strings, desde 04/09: o que
 * a pessoa LÊ é traduzido, o que o `<option>` CARREGA é um valor estável em
 * inglês (ver `PERFIS`/`ASSUNTOS` em `lib/formularios.ts`). Enquanto os dois
 * eram a mesma string, a mesma intenção virava duas linhas diferentes na
 * planilha, uma por idioma, e a coluna não agrupava.
 */
export function CampoSelect({
  id,
  name,
  rotulo,
  opcoes,
  className = ''
}: {
  id: string;
  name: string;
  rotulo: string;
  opcoes: readonly {valor: string; rotulo: string}[];
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className={estiloRotulo}>
        {rotulo}
      </label>
      <select id={id} name={name} className={estiloCampo} defaultValue="">
        <option value="" />
        {opcoes.map((opcao) => (
          <option key={opcao.valor} value={opcao.valor}>
            {opcao.rotulo}
          </option>
        ))}
      </select>
    </div>
  );
}
