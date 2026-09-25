import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import {botaoSecundario} from '@/components/ui/botoes';

// 404 na voz da marca, nos dois idiomas: uma linha sóbria e o caminho de volta.
export default function NaoEncontrada() {
  const t = useTranslations('naoEncontrada');

  return (
    <main className="flex min-h-[60svh] items-center py-secao">
      <div className="conteudo">
        <h1 className="max-w-[24ch] text-[clamp(2rem,3.6vw,2.7rem)]">{t('titulo')}</h1>
        <div className="mt-8">
          <Link href="/" className={botaoSecundario}>
            {t('voltar')}
          </Link>
        </div>
      </div>
    </main>
  );
}
