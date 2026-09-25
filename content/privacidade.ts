import type {Locale} from '@/i18n/routing';

/* =============================================================================
   POLÍTICA DE PRIVACIDADE · o conteúdo
   -----------------------------------------------------------------------------
   O MESTRE É O .md, e não este arquivo: site/politica-privacidade.md.
   Quando o Luís mandar correção, ela entra NO .md PRIMEIRO e só depois é
   trazida para cá. Nunca o contrário. Se os dois divergirem, o .md vence.
   O texto aqui é VERBATIM do .md, inclusive os `**` de negrito.

   POR QUE NÃO ESTÁ NO messages/en.json e pt.json: pelo mesmo motivo que os
   imóveis vendidos não estão (ver o cabeçalho de components/vendidos.tsx).
   São DADOS, não copy de interface. Uma política de privacidade é um
   DOCUMENTO: quinze seções em dois idiomas viram um nó de JSON impossível de
   revisar, e a correção do cliente chega em prosa, para alguém picar em chaves
   à mão. Aqui ela fica em prosa, do mesmo jeito que ele escreveu.

   O `**` é preservado de propósito: é ele que marca as partes juridicamente
   importantes no .md, e mantê-lo faz este arquivo poder ser comparado linha a
   linha com o mestre. Quem renderiza é o `negrito()` da página.
   ========================================================================== */

export type Bloco =
  | {tipo: 'p'; texto: string}
  | {tipo: 'sub'; texto: string}
  | {tipo: 'ul'; itens: string[]}
  | {tipo: 'tabela'; colunas: [string, string]; linhas: [string, string][]}
  | {tipo: 'destaque'; linhas: string[]};

export type Secao = {numero: number; titulo: string; blocos: Bloco[]};

export type Politica = {
  titulo: string;
  atualizacao: string;
  /** Nota de cortesia. Só o PT tem: o EN é a versão oficial. */
  cortesia: string | null;
  secoes: Secao[];
};

const EN: Politica = {
  titulo: 'Privacy Policy',
  atualizacao: 'Last updated: September 4, 2026',
  cortesia: null,
  secoes: [
    {
      numero: 1,
      titulo: 'Who this policy is about',
      blocos: [
        {
          tipo: 'p',
          texto:
            'This policy explains how **Luis Alves**, a licensed REALTOR® (Licence #190001) with **Stonehaus Realty Corp.**, collects, uses, discloses and protects your personal information.'
        },
        {tipo: 'p', texto: 'It covers two different situations:'},
        {
          tipo: 'ul',
          itens: [
            '**This website.** Anyone who fills in a form here, downloads the guide, or contacts Luis through the site.',
            '**The professional relationship.** Clients and other parties in a real estate transaction where Luis acts as their REALTOR®.'
          ]
        },
        {
          tipo: 'p',
          texto:
            "Real estate services in British Columbia are provided through a brokerage. Stonehaus Realty Corp. is the brokerage of record and holds the client files created in a transaction. Where the brokerage's own privacy policy applies to those files, it governs them. The brokerage publishes its own privacy notice at stonehausrealty.ca/privacy, and privacy enquiries about brokerage files can be sent to ricky@stonehausrealty.ca."
        }
      ]
    },
    {
      numero: 2,
      titulo: 'The law that applies',
      blocos: [
        {
          tipo: 'p',
          texto:
            'In British Columbia, private sector organizations are governed by the **Personal Information Protection Act (PIPA)**. Where a transaction or an activity crosses provincial or national borders, the federal **PIPEDA** may also apply.'
        },
        {tipo: 'p', texto: 'Two other rules shape what is written below:'},
        {
          tipo: 'ul',
          itens: [
            "**CASL**, Canada's Anti-Spam Legislation, governs the emails you may receive.",
            '**The Proceeds of Crime (Money Laundering) and Terrorist Financing Act**, administered by **FINTRAC**, requires real estate professionals to identify their clients and keep records. This is a legal obligation, not a choice.'
          ]
        }
      ]
    },
    {
      numero: 3,
      titulo: 'What we collect',
      blocos: [
        {tipo: 'sub', texto: '3.1 From this website'},
        {
          tipo: 'tabela',
          colunas: ['Where', 'What'],
          linhas: [
            [
              'Contact form',
              'Name, email, phone (optional), the subject you select, and your message'
            ],
            ['Guide / newsletter form', 'First name and email'],
            ['Home valuation form', 'Name, email, phone, property address'],
            [
              'WhatsApp button',
              "Nothing is collected by this site. The button opens WhatsApp, and from that point your conversation is handled by WhatsApp under Meta's own terms"
            ]
          ]
        },
        {
          tipo: 'p',
          texto:
            'We do not ask for financial details, identity documents or any sensitive information through this website. Please do not send them through a web form.'
        },
        {tipo: 'sub', texto: '3.2 Website measurement'},
        {
          tipo: 'p',
          texto:
            '**This website does not currently measure visits.** There is no analytics script, no tracking pixel and no advertising cookie on it. If measurement is added later, it will be a tool that counts page views in aggregate without identifying visitors, and this section will be updated before it goes live.'
        },
        {tipo: 'sub', texto: '3.3 As your REALTOR®'},
        {
          tipo: 'p',
          texto:
            'If you go on to work with Luis as a client, more information becomes necessary, including:'
        },
        {
          tipo: 'ul',
          itens: [
            'Contact details and the information needed to understand what you are looking for',
            '**For identity verification required by FINTRAC: your full name, address, date of birth and occupation**, and, where applicable, information about a corporation and who is authorized to bind it',
            'Documents connected to a transaction, such as contracts and correspondence'
          ]
        }
      ]
    },
    {
      numero: 4,
      titulo: 'Why we collect it',
      blocos: [
        {
          tipo: 'ul',
          itens: [
            'To answer you, and to provide the real estate services you ask for',
            'To send you the guide or the emails you asked to receive',
            'To meet legal and regulatory obligations, including FINTRAC identification and record keeping, and the rules of the BC Financial Services Authority',
            'To keep records of the advice given and the steps taken in a transaction'
          ]
        },
        {
          tipo: 'p',
          texto:
            'We do not sell your personal information. We do not rent it. We do not trade it.'
        }
      ]
    },
    {
      numero: 5,
      titulo: 'Consent',
      blocos: [
        {
          tipo: 'p',
          texto:
            'We tell you why we are collecting your information at the moment we collect it.'
        },
        {
          tipo: 'ul',
          itens: [
            'Filling in a form and sending it is your consent for us to use that information to reply to you.',
            'Ticking the box to receive the guide or emails is your **express consent** under CASL.',
            'Some collection is required by law, such as FINTRAC identification. Consent does not apply there: without it, the transaction cannot proceed.'
          ]
        },
        {
          tipo: 'p',
          texto:
            '**You can withdraw consent at any time**, subject to legal and contractual limits. Write to the contact in section 12. We will tell you what withdrawing means in practice before we act on it.'
        }
      ]
    },
    {
      numero: 6,
      titulo: 'Emails, and how to stop them',
      blocos: [
        {
          tipo: 'p',
          texto:
            'Every commercial email we send includes who it is from, a current mailing address, a way to contact us, and a working unsubscribe link.'
        },
        {
          tipo: 'p',
          texto:
            '**Unsubscribing is free, and we action it within 10 business days**, as CASL requires.'
        },
        {
          tipo: 'p',
          texto:
            'Unsubscribing from marketing emails does not stop the emails that are part of a transaction you are in.'
        }
      ]
    },
    {
      numero: 7,
      titulo: 'Who we share it with',
      blocos: [
        {
          tipo: 'ul',
          itens: [
            '**Stonehaus Realty Corp.**, the brokerage, which is required to supervise and keep records of the work',
            '**Service providers** who operate the website, send email and store files on our behalf, and only for that purpose',
            '**Other professionals in your transaction**, when you ask us to, such as lawyers, notaries, mortgage brokers and inspectors',
            "**The real estate board and MLS®**, for property listing information, under the board's own rules",
            '**Government authorities**, when the law requires it. This includes reports to FINTRAC'
          ]
        }
      ]
    },
    {
      numero: 8,
      titulo: 'Where your information is stored',
      blocos: [
        {
          tipo: 'p',
          texto:
            'This website and the services that support it are operated by providers that may store information **on servers outside Canada, including in the United States**. Information stored in another country may be accessible to the authorities of that country under its laws. This website is hosted by **Vercel Inc., in the United States**. This policy is updated whenever a new provider begins handling personal information on our behalf.'
        }
      ]
    },
    {
      numero: 9,
      titulo: 'How long we keep it',
      blocos: [
        {
          tipo: 'ul',
          itens: [
            '**Transaction and identification records: at least five years**, counted from the day the last business transaction was conducted. This period is set by FINTRAC and is not ours to shorten.',
            '**Information used to make a decision that directly affects you: at least one year**, as PIPA requires, so that you have time to ask for access.',
            '**Website enquiries and email subscribers: 24 months** from your last contact with us, or until you ask us to delete them, whichever comes first.'
          ]
        },
        {
          tipo: 'p',
          texto:
            'When information is no longer needed for the purpose it was collected for, and no legal obligation requires us to keep it, it is securely destroyed.'
        }
      ]
    },
    {
      numero: 10,
      titulo: 'How we protect it',
      blocos: [
        {
          tipo: 'p',
          texto:
            'We limit access to the people who need it to do the work, we use reputable providers with their own security controls, and we keep the number of copies small. No system is perfectly secure, and we do not claim otherwise. If a breach occurs that creates a real risk of significant harm, we will act on it and notify as the law requires.'
        }
      ]
    },
    {
      numero: 11,
      titulo: 'Your information, your rights',
      blocos: [
        {
          tipo: 'p',
          texto:
            '**Accuracy.** If something we hold about you is wrong or out of date, tell us and we will correct it.'
        },
        {
          tipo: 'p',
          texto:
            '**Access.** You can ask what personal information we hold about you, how it has been used, and who it has been disclosed to. **We will respond within 30 business days.** In limited cases the law allows us to refuse; if that happens we will tell you why.'
        },
        {
          tipo: 'p',
          texto:
            'There is normally no charge. If a request takes significant time or copying, we may charge a minimal fee and we will tell you the amount before doing the work.'
        }
      ]
    },
    {
      numero: 12,
      titulo: 'Questions and complaints',
      blocos: [
        {
          tipo: 'p',
          texto:
            'The person responsible for compliance with PIPA for Luis Alves REALTOR® is:'
        },
        {
          tipo: 'destaque',
          linhas: [
            '**Luis Alves**, REALTOR®, Licence #190001',
            'Stonehaus Realty Corp. · Brokerage Licence X033420',
            'Suite A, 1126 Austin Avenue, Coquitlam, BC V3K 3P5',
            'Luisalves.realestate@gmail.com · +1 778 233 9906'
          ]
        },
        {
          tipo: 'p',
          texto:
            'Please contact us first. We would rather fix a problem than have you go elsewhere with it.'
        },
        {
          tipo: 'p',
          texto:
            'If you are not satisfied with our response, you may complain to the **Office of the Information and Privacy Commissioner for British Columbia**:'
        },
        {
          tipo: 'destaque',
          linhas: [
            'Telephone: (250) 387-5629',
            'Email: info@oipc.bc.ca',
            'Complaint form: oipc.bc.ca/forms/individuals/complaints/'
          ]
        }
      ]
    },
    {
      numero: 13,
      titulo: 'Children',
      blocos: [
        {
          tipo: 'p',
          texto:
            'This website is not directed at children and we do not knowingly collect personal information from anyone under the age of majority in British Columbia.'
        }
      ]
    },
    {
      numero: 14,
      titulo: 'Changes to this policy',
      blocos: [
        {
          tipo: 'p',
          texto:
            'If this policy changes, the new version is published on this page with a new date at the top. Material changes will be signalled clearly.'
        }
      ]
    },
    {
      numero: 15,
      titulo: 'Language',
      blocos: [
        {
          tipo: 'p',
          texto:
            'This English version is the official version of this policy. The Portuguese version is provided as a courtesy for Portuguese speaking clients. **If the two versions differ, the English version governs.**'
        }
      ]
    }
  ]
};

const PT: Politica = {
  titulo: 'Política de Privacidade',
  atualizacao: 'Última atualização: 4 de setembro de 2026',
  cortesia:
    'Esta versão em português existe como cortesia para clientes lusófonos. A versão em inglês é a oficial. **Havendo divergência entre as duas, prevalece a versão em inglês.**',
  secoes: [
    {
      numero: 1,
      titulo: 'Sobre quem é esta política',
      blocos: [
        {
          tipo: 'p',
          texto:
            'Esta política explica como **Luis Alves**, REALTOR® licenciado (Licença #190001) na **Stonehaus Realty Corp.**, coleta, usa, divulga e protege as suas informações pessoais.'
        },
        {tipo: 'p', texto: 'Ela cobre duas situações diferentes:'},
        {
          tipo: 'ul',
          itens: [
            '**Este site.** Quem preenche um formulário aqui, baixa o guia ou entra em contato com o Luis pelo site.',
            '**A relação profissional.** Clientes e demais partes de uma transação imobiliária em que o Luis atua como REALTOR®.'
          ]
        },
        {
          tipo: 'p',
          texto:
            'Na Colúmbia Britânica, os serviços imobiliários são prestados por meio de uma corretora. A Stonehaus Realty Corp. é a corretora responsável e guarda os arquivos de cliente gerados numa transação. Onde a política própria da corretora se aplicar a esses arquivos, é ela que rege. A corretora publica o aviso de privacidade dela em stonehausrealty.ca/privacy, e pedidos sobre arquivos da corretora podem ser enviados para ricky@stonehausrealty.ca.'
        }
      ]
    },
    {
      numero: 2,
      titulo: 'A lei aplicável',
      blocos: [
        {
          tipo: 'p',
          texto:
            'Na Colúmbia Britânica, as organizações privadas são regidas pelo **Personal Information Protection Act (PIPA)**. Quando uma transação ou atividade cruza a fronteira da província ou do país, a lei federal **PIPEDA** também pode se aplicar.'
        },
        {tipo: 'p', texto: 'Duas outras regras moldam o que está escrito abaixo:'},
        {
          tipo: 'ul',
          itens: [
            'A **CASL**, a lei antispam do Canadá, rege os e-mails que você pode receber.',
            'A lei de prevenção à lavagem de dinheiro, administrada pelo **FINTRAC**, obriga profissionais do setor imobiliário a identificar seus clientes e guardar registros. É obrigação legal, não escolha.'
          ]
        }
      ]
    },
    {
      numero: 3,
      titulo: 'O que coletamos',
      blocos: [
        {tipo: 'sub', texto: '3.1 Neste site'},
        {
          tipo: 'tabela',
          colunas: ['Onde', 'O quê'],
          linhas: [
            [
              'Formulário de contato',
              'Nome, e-mail, telefone (opcional), o assunto escolhido e a sua mensagem'
            ],
            ['Formulário do guia', 'Primeiro nome e e-mail'],
            ['Formulário de avaliação', 'Nome, e-mail, telefone e endereço do imóvel'],
            [
              'Botão de WhatsApp',
              'Este site não coleta nada. O botão abre o WhatsApp, e a partir dali a conversa é tratada pelo WhatsApp sob os termos da Meta'
            ]
          ]
        },
        {
          tipo: 'p',
          texto:
            'Não pedimos dados financeiros, documentos de identidade nem informação sensível por este site. Por favor, não envie esse tipo de dado por formulário.'
        },
        {tipo: 'sub', texto: '3.2 Medição do site'},
        {
          tipo: 'p',
          texto:
            '**Hoje este site não faz medição de visitas.** Não há script de analytics, nem pixel de rastreamento, nem cookie de publicidade. Se a medição for adicionada, será uma ferramenta que conta páginas vistas de forma agregada, sem identificar visitantes, e esta seção será atualizada antes de entrar no ar.'
        },
        {tipo: 'sub', texto: '3.3 Como seu REALTOR®'},
        {
          tipo: 'p',
          texto:
            'Se você passar a trabalhar com o Luis como cliente, mais informações se tornam necessárias, incluindo:'
        },
        {
          tipo: 'ul',
          itens: [
            'Dados de contato e o que for preciso para entender o que você procura',
            '**Para a verificação de identidade exigida pelo FINTRAC: nome completo, endereço, data de nascimento e ocupação**, e, quando aplicável, dados da empresa e de quem tem poder para obrigá-la',
            'Documentos ligados à transação, como contratos e correspondência'
          ]
        }
      ]
    },
    {
      numero: 4,
      titulo: 'Por que coletamos',
      blocos: [
        {
          tipo: 'ul',
          itens: [
            'Para responder a você e prestar o serviço imobiliário solicitado',
            'Para enviar o guia ou os e-mails que você pediu para receber',
            'Para cumprir obrigações legais e regulatórias, incluindo identificação e guarda de registros do FINTRAC e as regras da BC Financial Services Authority',
            'Para manter registro do que foi orientado e feito numa transação'
          ]
        },
        {
          tipo: 'p',
          texto:
            'Não vendemos, não alugamos e não trocamos as suas informações pessoais.'
        }
      ]
    },
    {
      numero: 5,
      titulo: 'Consentimento',
      blocos: [
        {
          tipo: 'p',
          texto: 'Dizemos por que estamos coletando no momento em que coletamos.'
        },
        {
          tipo: 'ul',
          itens: [
            'Preencher e enviar um formulário é o seu consentimento para usarmos aquilo para responder a você.',
            'Marcar a caixa para receber o guia ou os e-mails é **consentimento expresso** sob a CASL.',
            'Parte da coleta é exigida por lei, como a identificação do FINTRAC. Ali não há consentimento a dar: sem ela, a transação não avança.'
          ]
        },
        {
          tipo: 'p',
          texto:
            '**Você pode retirar o consentimento a qualquer momento**, respeitados os limites legais e contratuais. Escreva para o contato da seção 12. Antes de agir, explicamos o que a retirada significa na prática.'
        }
      ]
    },
    {
      numero: 6,
      titulo: 'E-mails, e como parar de recebê-los',
      blocos: [
        {
          tipo: 'p',
          texto:
            'Todo e-mail comercial que enviamos traz quem o envia, um endereço postal atual, uma forma de contato e um link de descadastro que funciona.'
        },
        {
          tipo: 'p',
          texto:
            '**Descadastrar é gratuito, e cumprimos o pedido em até 10 dias úteis**, como a CASL exige.'
        },
        {
          tipo: 'p',
          texto:
            'Sair da lista de marketing não interrompe os e-mails que fazem parte de uma transação em andamento.'
        }
      ]
    },
    {
      numero: 7,
      titulo: 'Com quem compartilhamos',
      blocos: [
        {
          tipo: 'ul',
          itens: [
            '**Stonehaus Realty Corp.**, a corretora, que precisa supervisionar e guardar registro do trabalho',
            '**Fornecedores** que operam o site, enviam e-mail e guardam arquivos em nosso nome, e apenas para isso',
            '**Outros profissionais da sua transação**, quando você pede, como advogados, notários, corretores de hipoteca e inspetores',
            '**O board imobiliário e o MLS®**, para informação de anúncios, sob as regras do próprio board',
            '**Autoridades públicas**, quando a lei exige. Isso inclui reportes ao FINTRAC'
          ]
        }
      ]
    },
    {
      numero: 8,
      titulo: 'Onde as informações ficam',
      blocos: [
        {
          tipo: 'p',
          texto:
            'Este site e os serviços que o sustentam são operados por fornecedores que podem guardar informação **em servidores fora do Canadá, inclusive nos Estados Unidos**. Informação guardada em outro país pode ficar acessível às autoridades daquele país conforme a lei de lá. Este site é hospedado pela **Vercel Inc., nos Estados Unidos**. Esta política é atualizada sempre que um novo fornecedor passa a tratar informação pessoal em nosso nome.'
        }
      ]
    },
    {
      numero: 9,
      titulo: 'Por quanto tempo guardamos',
      blocos: [
        {
          tipo: 'ul',
          itens: [
            '**Registros de transação e de identificação: no mínimo cinco anos**, contados do dia da última transação realizada. Esse prazo é do FINTRAC e não está ao nosso alcance encurtar.',
            '**Informação usada para tomar decisão que afeta você diretamente: no mínimo um ano**, como a PIPA exige, para dar tempo de você pedir acesso.',
            '**Contatos do site e inscritos de e-mail: 24 meses** contados do seu último contato conosco, ou até você pedir a exclusão, o que vier primeiro.'
          ]
        },
        {
          tipo: 'p',
          texto:
            'Quando a informação deixa de ser necessária e nenhuma obrigação legal exige a guarda, ela é destruída de forma segura.'
        }
      ]
    },
    {
      numero: 10,
      titulo: 'Como protegemos',
      blocos: [
        {
          tipo: 'p',
          texto:
            'Limitamos o acesso a quem precisa para trabalhar, usamos fornecedores idôneos com controles próprios de segurança, e mantemos poucas cópias. Nenhum sistema é perfeitamente seguro, e não afirmamos o contrário. Se ocorrer um incidente com risco real de dano significativo, agimos e notificamos conforme a lei exige.'
        }
      ]
    },
    {
      numero: 11,
      titulo: 'Seus direitos',
      blocos: [
        {
          tipo: 'p',
          texto:
            '**Correção.** Se algo que guardamos sobre você estiver errado ou desatualizado, avise e corrigimos.'
        },
        {
          tipo: 'p',
          texto:
            '**Acesso.** Você pode perguntar quais informações pessoais temos sobre você, como foram usadas e a quem foram divulgadas. **Respondemos em até 30 dias úteis.** Em casos limitados a lei permite recusar; se isso acontecer, dizemos o motivo.'
        },
        {
          tipo: 'p',
          texto:
            'Normalmente não há cobrança. Se o pedido exigir tempo ou cópias em volume, podemos cobrar um valor mínimo, e informamos o valor antes de executar.'
        }
      ]
    },
    {
      numero: 12,
      titulo: 'Dúvidas e reclamações',
      blocos: [
        {
          tipo: 'p',
          texto:
            'A pessoa responsável pelo cumprimento da PIPA em Luis Alves REALTOR® é:'
        },
        {
          tipo: 'destaque',
          linhas: [
            '**Luis Alves**, REALTOR®, Licença #190001',
            'Stonehaus Realty Corp. · Licença de corretora X033420',
            'Suite A, 1126 Austin Avenue, Coquitlam, BC V3K 3P5',
            'Luisalves.realestate@gmail.com · +1 778 233 9906'
          ]
        },
        {
          tipo: 'p',
          texto:
            'Fale conosco primeiro. Preferimos resolver a levar você a procurar outra instância.'
        },
        {
          tipo: 'p',
          texto:
            'Se a resposta não resolver, você pode reclamar ao **Office of the Information and Privacy Commissioner for British Columbia**:'
        },
        {
          tipo: 'destaque',
          linhas: [
            'Telefone: (250) 387-5629',
            'E-mail: info@oipc.bc.ca',
            'Formulário: oipc.bc.ca/forms/individuals/complaints/'
          ]
        }
      ]
    },
    {
      numero: 13,
      titulo: 'Crianças',
      blocos: [
        {
          tipo: 'p',
          texto:
            'Este site não é dirigido a crianças e não coletamos conscientemente informação pessoal de menores de idade na Colúmbia Britânica.'
        }
      ]
    },
    {
      numero: 14,
      titulo: 'Mudanças nesta política',
      blocos: [
        {
          tipo: 'p',
          texto:
            'Se esta política mudar, a nova versão é publicada nesta página com data nova no topo. Mudanças materiais são sinalizadas com clareza.'
        }
      ]
    },
    {
      numero: 15,
      titulo: 'Idioma',
      blocos: [
        {
          tipo: 'p',
          texto:
            'A versão em inglês é a oficial. A versão em português existe como cortesia. **Havendo divergência, prevalece a inglesa.**'
        }
      ]
    }
  ]
};

export const POLITICA: Record<Locale, Politica> = {en: EN, pt: PT};
