import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector) 
  .use(initReactI18next)
  .init({
    debug: true,
    fallbackLng: 'en', 
    interpolation: {
      escapeValue: false, 
    },
    resources: {
en: {
      translation: {
        common: {
          loading: "Loading...",
          load_more: "Load More",
          back: "Back",
          public: "Public",
          private: "Private",
          yesterday: "Yesterday",
          unknown_user: "Unknown User",
          today: "Today",
        },
        profile: {
          not_found: "User not found",
          joined: "Joined {{date}}",
          essays_by: "Essays by {{name}}",
          no_essays: "No essays yet",
          yesterday: "Ontem",
          unknown_user: "Usuário Desconhecido"
        },
        friendship: {
          send_request: "Send Friend Request",
          pending: "Request Pending",
          friends: "Friends",
          message: "Message",
          toast: {
            sent_title: "Friend request sent",
            sent_desc: "Your friend request has been sent successfully!",
            error_title: "Request failed",
            error_desc: "Failed to send friend request. Please try again."
          }
        },
        essay: {
          words_count: "{{count}} words",
        },
        auth: {
  signup: {
    title: "Create an account",
    desc: "Enter your details below to create your account",
    submit: "Sign up",
    loading: "Creating account...",
    have_account: "Already have an account?",
    login_link: "Login",
    success_title: "Account created!",
    success_desc: "Welcome to EssayAI. Let's start writing!",
    failed_title: "Signup failed",
    failed_default: "Failed to create account"
  },
  login: {
  title: "Login",
  desc: "Enter your username and password to access your account",
  submit: "Login",
  loading: "Logging in...",
  no_account: "Don't have an account?",
  signup_link: "Sign up",
  success_title: "Welcome back!",
  success_desc: "You have been logged in successfully.",
  failed_title: "Login failed",
  failed_default: "Invalid username or password"
},
  fields: {
    username: "Username",
    password: "Password",
    display_name: "Display Name",
    bio_optional: "Bio (optional)"
  },
  placeholders: {
    username: "Choose a username",
    password: "Create a password",
    display_name: "Your name",
    bio: "Tell us about yourself...",
    enter_username: "Enter your username",
  enter_password: "Enter your password"
  }
},

editor: {
  header: "Essay Editor",
  words: "{{count}} words",
  analyze: "Analyze",
  analyzing: "Analyzing...",
  untitled: "Untitled Essay",
  placeholders: {
    title: "Essay Title",
    content: "Start writing your essay..."
  },
  toast: {
    saved_title: "Essay saved",
    saved_desc: "Your essay has been saved successfully.",
    save_failed_title: "Save failed",
    save_failed_desc: "Failed to save essay. Please try again.",
    analysis_complete: "AI Analysis complete",
    analysis_desc: "AI review generated with {{count}} suggestions. Redirecting to view...",
    analysis_failed: "Analysis failed",
    analysis_failed_default: "Failed to analyze essay. Please try again.",
    content_req_title: "Content required",
    content_req_desc: "Please add a title and content before analyzing."
  }
},
inspirations: {
  header: {
    title: "Inspirations",
    subtitle: "Discover wisdom from great thinkers and writers"
  },
  filters: {
    search: "Search inspirations, authors, or topics...",
    category: "Category",
    type: "Type",
    difficulty: "Difficulty",
    all_categories: "All Categories",
    all_types: "All Types",
    all_levels: "All Levels",
    clear: "Clear Filters",
    showing: "Showing {{count}} of {{total}} inspirations"
  },
  empty: {
    title: "No inspirations found",
    desc_search: "Try adjusting your search or filters.",
    desc_default: "Check back later for new inspirational content."
  },
  card: {
    read_time: "min read",
    source: "Source",
    more_tags: "+{{count}} more"
  },
  categories: {
    literature: "Literature",
    science: "Science",
    philosophy: "Philosophy",
    technology: "Technology",
    environment: "Environment",
    history: "History"
  },
  types: {
    book: "Book",
    article: "Article",
    quote: "Quote",
    excerpt: "Excerpt"
  },
  difficulties: {
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced"
  }
}, 
library: {
  header: {
    title: "My Essay Library",
    subtitle: "Manage and review your written essays"
  },
  search_placeholder: "Search essays...",
  new_essay: "New Essay",
  filters: {
    all: "All Essays",
    drafts: "Drafts",
    published: "Published",
    analyzed: "Analyzed"
  },
  status: {
    published: "Published",
    analyzed: "Analyzed",
    draft: "Draft"
  },
  card: {
    words: "{{count}} words",
    view: "View",
    edit: "Edit",
    confirm_delete: "Are you sure you want to delete this essay? This action cannot be undone."
  },
  empty: {
    title: "No essays found",
    desc_search: "Try adjusting your search terms.",
    desc_default: "Start writing your first essay!",
    create: "Create Essay"
  },
  load_more: "Load More Essays",
  toast: {
    deleted_title: "Essay deleted",
    deleted_desc: "The essay has been deleted successfully.",
    delete_failed_title: "Delete failed",
    delete_failed_desc: "Failed to delete essay. Please try again.",
    published_title: "Essay published",
    published_desc: "Your essay is now visible to the community.",
    unpublished_title: "Essay unpublished",
    unpublished_desc: "Your essay is now private.",
    action_failed_title: "Action failed",
    action_failed_desc: "Failed to update essay visibility. Please try again."
  }
},
community: {
  header: {
    title: "Community Essays",
    subtitle: "Discover and learn from essays shared by other writers"
  },
  filters: {
    all_topics: "All Topics",
    technology: "Technology",
    science: "Science",
    literature: "Literature",
    environment: "Environment"
  },
  topics: {
    technology: "Technology",
    environment: "Environment",
    literature: "Literature",
    science: "Science",
    general: "General"
  },
  empty: {
    title: "No community essays yet",
    desc: "Be the first to share your essay with the community!"
  },
  card: {
    min_read: "min read",
    words: "words"
  },
  load_more: "Load More Essays",
  end_of_list: "You've reached the end of the list.",
  toast: {
    like_failed_title: "Action failed",
    like_failed_desc: "Failed to update like. Please try again.",
    request_sent_title: "Friend request sent",
    request_sent_desc: "Your friend request has been sent successfully!",
    request_failed_title: "Request failed",
    request_failed_desc: "Failed to send friend request. Please try again."
  }
},
nav: {
  write: "Write",
  library: "Library",
  explore: "Explore",
  community: "Community",
  profile: "Profile"
},
essay_detail: {
  not_found: "Essay not found",
  loading: "Loading essay...",
  scores: {
    no_reviews: "No reviews yet",
    selected_review: "Selected Review Score",
    current_score: "Your Current Score",
    average: "Average Score ({{count}} reviews)",
    overall: "Overall Score"
  },
  content: {
    title: "Essay Content",
    clear_highlights: "Clear Highlights"
  },
  comments: {
    title: "Peer Review Comments",
    selected_title: "Selected Review Comments",
    reviewer: "Reviewer",
    viewing: "Viewing",
    ai_label: "AI Analysis",
    count: "{{count}} comments",
    selected_text_label: "Selected Text:",
    your_comments: "Your Comments"
  },
  panel: {
    your_essay_title: "Your Essay",
    your_essay_desc: "This is your essay. You cannot review your own work, but you can see reviews from others below.",
    peer_review_title: "Peer Review",
    progress: "{{reviewed}} of {{total}} categories reviewed",
    comment_instruction: "Add a comment to justify your score (optionally select text from the essay to reference)",
    placeholder_active: "Explain your evaluation for this category...",
    placeholder_locked: "Review is submitted and locked",
    btn_adding: "Adding...",
    btn_submitted: "Review Submitted",
    btn_add: "Add Comment to This Category",
    submit_locked: "Review Locked ✓",
    submit_loading: "Submitting...",
    submit_action: "Submit Complete Review",
    msg_locked: "✓ Review submitted and locked",
    msg_incomplete: "Please complete all 6 categories by adjusting their scores before submitting"
  },
  community_reviews: {
    title: "Community Reviews",
    load_older: "Load older reviews"
  },
  categories: {
    grammar: { label: "Grammar & Mechanics", desc: "Spelling, punctuation, syntax" },
    style: { label: "Style & Voice", desc: "Writing style, tone, word choice" },
    clarity: { label: "Clarity & Flow", desc: "Sentence structure, transitions" },
    structure: { label: "Structure & Organization", desc: "Logical flow, paragraph structure" },
    content: { label: "Content & Ideas", desc: "Argument strength, evidence, depth" },
    research: { label: "Research & Evidence", desc: "Sources, citations, support" }
  },
  toast: {
    cannot_review: "Cannot review",
    cannot_review_own: "You cannot review your own essay.",
    comment_added: "Comment added",
    comment_saved: "Your comment has been saved successfully.",
    comment_failed: "Failed to add comment",
    missing_info: "Missing information",
    missing_comment: "Please add a comment.",
    incomplete: "Incomplete review",
    incomplete_desc: "Please complete all six category scores before submitting.",
    submitted: "Review submitted",
    submitted_desc: "Your peer review has been saved successfully.",
    submitted_locked: "Your peer review has been locked and submitted successfully.",
    submit_failed: "Failed to submit review"
  }
},
user_profile: {
  header: {
    display_name_placeholder: "Display Name",
    username_placeholder: "Username",
    bio_placeholder: "Tell us about yourself...",
    no_bio: "No bio yet. Click edit to add one!",
    save: "Save",
    saving: "Saving...",
    edit: "Edit"
  },
  tabs: {
    messages: "Messages",
    friends: "Friends",
    discover: "Discover",
    settings: "Settings"
  },
  messages: {
    title: "Conversations",
    empty: "Select a conversation to start chatting"
  },
  friends: {
    title: "Friends & Requests",
    no_friends: "No friends yet",
    connect_hint: "Connect with other writers in the community",
    pending: "Pending",
    accepted: "Friends"
  },
  discover: {
    title: "Discover Writers",
    search_placeholder: "Search by name or username...",
    no_results: "No users found matching your search",
    no_users: "No users to discover yet",
    load_more: "Load More Profiles",
    end_list: "End of list",
    connect: "Connect"
  },
  settings: {
    title: "Settings",
    appearance: {
      title: "Appearance",
      theme: "Theme",
      theme_desc: "Choose your preferred color theme"
    },
    preferences: {
      title: "Preferences",
      language: "Language",
      language_desc: "Select your interface language"
    },
    account: {
      title: "Account",
      sign_out: "Sign Out"
    }
  },
  toast: {
    new_connection: "New Connection",
    new_connection_desc: "You received a new friend request!",
    request_accepted: "Friend Request Accepted",
    profile_updated: "Profile updated",
    profile_updated_desc: "Your profile has been saved successfully.",
    update_failed: "Update failed",
    update_failed_desc: "Failed to update profile. Please try again.",
    friendship_accepted: "You accepted the friendship",
    friendship_accepted_desc: "You are now friends!",
    request_sent: "Friend request sent",
    request_sent_desc: "Your friend request has been sent successfully!",
    request_failed: "Request failed",
    request_failed_desc: "Failed to send friend request. Please try again."
  }
},
conversations: {
  empty: {
    title: "No conversations yet",
    desc: "Start a conversation by visiting a user's profile"
  }
},
thread: {
  placeholder: "Message {{name}}...",
  no_messages: "No messages yet. Start the conversation!",
  typing_hint: "Press Enter to send, Shift+Enter for new line",
  toast: {
    send_failed: "Failed to send",
    send_failed_desc: "Could not send your message. Please try again."
  }
}
      }},
pt: {
      translation: {
        common: {
          loading: "Carregando...",
          load_more: "Carregar Mais",
          back: "Voltar",
          public: "Público",
          private: "Privado",
          yesterday: "Ontem",
          unknown_user: "Usuário Desconhecido",
          today: "Today",
        },
        profile: {
          not_found: "Usuário não encontrado",
          joined: "Entrou em {{date}}",
          essays_by: "Redações de {{name}}",
          no_essays: "Nenhuma redação ainda"
        },
        friendship: {
          send_request: "Enviar Solicitação",
          pending: "Pendente",
          friends: "Amigos",
          message: "Mensagem",
          toast: {
            sent_title: "Solicitação enviada",
            sent_desc: "Sua solicitação de amizade foi enviada com sucesso!",
            error_title: "Falha na solicitação",
            error_desc: "Falha ao enviar solicitação. Tente novamente."
          }
        },
        essay: {
          words_count: "{{count}} palavras",
        },
        auth: {
  signup: {
    title: "Criar uma conta",
    desc: "Insira seus dados abaixo para criar sua conta",
    submit: "Cadastrar",
    loading: "Criando conta...",
    have_account: "Já tem uma conta?",
    login_link: "Entrar",
    success_title: "Conta criada!",
    success_desc: "Bem-vindo ao EssayAI. Vamos escrever!",
    failed_title: "Falha no cadastro",
    failed_default: "Falha ao criar conta"
  },
login: {
  title: "Entrar",
  desc: "Digite seu usuário e senha para acessar sua conta",
  submit: "Entrar",
  loading: "Entrando...",
  no_account: "Não tem uma conta?",
  signup_link: "Cadastre-se",
  success_title: "Bem-vindo de volta!",
  success_desc: "Você entrou com sucesso.",
  failed_title: "Falha no login",
  failed_default: "Usuário ou senha inválidos"
},
  fields: {
    username: "Nome de usuário",
    password: "Senha",
    display_name: "Nome de exibição",
    bio_optional: "Bio (opcional)"
  },
  placeholders: {
    username: "Escolha um usuário",
    password: "Crie uma senha",
    display_name: "Seu nome",
    bio: "Conte-nos sobre você...",
    enter_username: "Digite seu usuário",
  enter_password: "Digite sua senha"
  },},
editor: {
  header: "Editor",
  words: "{{count}} palavras",
  analyze: "Analisar",
  analyzing: "Analisando...",
  untitled: "Redação Sem Título",
  placeholders: {
    title: "Título da Redação",
    content: "Comece a escrever sua redação..."
  },
  toast: {
    saved_title: "Redação salva",
    saved_desc: "Sua redação foi salva com sucesso.",
    save_failed_title: "Falha ao salvar",
    save_failed_desc: "Falha ao salvar redação. Tente novamente.",
    analysis_complete: "Análise de IA concluída",
    analysis_desc: "Revisão gerada com {{count}} sugestões. Redirecionando...",
    analysis_failed: "Falha na análise",
    analysis_failed_default: "Falha ao analisar redação. Tente novamente.",
    content_req_title: "Conteúdo necessário",
    content_req_desc: "Por favor, adicione título e conteúdo antes de analisar."
  }
},

  inspirations: {
  header: {
    title: "Inspirações",
    subtitle: "Descubra a sabedoria de grandes pensadores e escritores"
  },
  filters: {
    search: "Buscar inspirações, autores ou tópicos...",
    category: "Categoria",
    type: "Tipo",
    difficulty: "Dificuldade",
    all_categories: "Todas Categorias",
    all_types: "Todos Tipos",
    all_levels: "Todos Níveis",
    clear: "Limpar Filtros",
    showing: "Mostrando {{count}} de {{total}} inspirações"
  },
  empty: {
    title: "Nenhuma inspiração encontrada",
    desc_search: "Tente ajustar sua busca ou filtros.",
    desc_default: "Verifique mais tarde por novos conteúdos inspiradores."
  },
  card: {
    read_time: "min de leitura",
    source: "Fonte",
    more_tags: "+{{count}} mais"
  },
  categories: {
    literature: "Literatura",
    science: "Ciência",
    philosophy: "Filosofia",
    technology: "Tecnologia",
    environment: "Meio Ambiente",
    history: "História"
  },
  types: {
    book: "Livro",
    article: "Artigo",
    quote: "Citação",
    excerpt: "Trecho"
  },
  difficulties: {
    beginner: "Iniciante",
    intermediate: "Intermediário",
    advanced: "Avançado"
  }
},
library: {
  header: {
    title: "Minha Biblioteca",
    subtitle: "Gerencie e revise suas redações"
  },
  search_placeholder: "Buscar redações...",
  new_essay: "Nova Redação",
  filters: {
    all: "Todas",
    drafts: "Rascunhos",
    published: "Publicadas",
    analyzed: "Analisadas"
  },
  status: {
    published: "Publicado",
    analyzed: "Analisado",
    draft: "Rascunho"
  },
  card: {
    words: "{{count}} palavras",
    view: "Ver",
    edit: "Editar",
    confirm_delete: "Tem certeza que deseja excluir esta redação? Esta ação não pode ser desfeita."
  },
  empty: {
    title: "Nenhuma redação encontrada",
    desc_search: "Tente ajustar seus termos de busca.",
    desc_default: "Comece a escrever sua primeira redação!",
    create: "Criar Redação"
  },
  load_more: "Carregar Mais",
  toast: {
    deleted_title: "Redação excluída",
    deleted_desc: "A redação foi excluída com sucesso.",
    delete_failed_title: "Falha na exclusão",
    delete_failed_desc: "Falha ao excluir redação. Tente novamente.",
    published_title: "Redação publicada",
    published_desc: "Sua redação agora está visível para a comunidade.",
    unpublished_title: "Redação despublicada",
    unpublished_desc: "Sua redação agora é privada.",
    action_failed_title: "Ação falhou",
    action_failed_desc: "Falha ao atualizar visibilidade. Tente novamente."
  }
},
community: {
  header: {
    title: "Redações da Comunidade",
    subtitle: "Descubra e aprenda com redações compartilhadas por outros escritores"
  },
  filters: {
    all_topics: "Todos os Tópicos",
    technology: "Tecnologia",
    science: "Ciência",
    literature: "Literatura",
    environment: "Meio Ambiente"
  },
  topics: {
    technology: "Tecnologia",
    environment: "Meio Ambiente",
    literature: "Literatura",
    science: "Ciência",
    general: "Geral"
  },
  empty: {
    title: "Nenhuma redação da comunidade ainda",
    desc: "Seja o primeiro a compartilhar sua redação com a comunidade!"
  },
  card: {
    min_read: "min de leitura",
    words: "palavras"
  },
  load_more: "Carregar Mais Redações",
  end_of_list: "Você chegou ao fim da lista.",
  toast: {
    like_failed_title: "Ação falhou",
    like_failed_desc: "Falha ao atualizar curtida. Tente novamente.",
    request_sent_title: "Solicitação enviada",
    request_sent_desc: "Sua solicitação de amizade foi enviada com sucesso!",
    request_failed_title: "Falha na solicitação",
    request_failed_desc: "Falha ao enviar solicitação. Tente novamente."
  }
},
nav: {
  write: "Escrever",
  library: "Biblioteca",
  inspirations: "Inspirações",
  community: "Comunidade",
  profile: "Perfil"
},
essay_detail: {
  not_found: "Redação não encontrada",
  loading: "Carregando redação...",
  scores: {
    no_reviews: "Sem avaliações",
    selected_review: "Nota da Avaliação Selecionada",
    current_score: "Sua Nota Atual",
    average: "Média ({{count}} avaliações)",
    overall: "Nota Geral"
  },
  content: {
    title: "Conteúdo da Redação",
    clear_highlights: "Limpar Destaques"
  },
  comments: {
    title: "Comentários da Revisão",
    selected_title: "Comentários Selecionados",
    reviewer: "Revisor",
    viewing: "Vendo",
    ai_label: "Análise de IA",
    count: "{{count}} comentários",
    selected_text_label: "Texto Selecionado:",
    your_comments: "Seus Comentários"
  },
  panel: {
    your_essay_title: "Sua Redação",
    your_essay_desc: "Esta é sua redação. Você não pode avaliar seu próprio trabalho, mas pode ver avaliações de outros abaixo.",
    peer_review_title: "Revisão por Pares",
    progress: "{{reviewed}} de {{total}} categorias avaliadas",
    comment_instruction: "Adicione um comentário para justificar sua nota (opcionalmente selecione texto da redação para referenciar)",
    placeholder_active: "Explique sua avaliação para esta categoria...",
    placeholder_locked: "Avaliação enviada e bloqueada",
    btn_adding: "Adicionando...",
    btn_submitted: "Avaliação Enviada",
    btn_add: "Adicionar Comentário",
    submit_locked: "Avaliação Bloqueada ✓",
    submit_loading: "Enviando...",
    submit_action: "Enviar Avaliação Completa",
    msg_locked: "✓ Avaliação enviada e bloqueada",
    msg_incomplete: "Por favor, complete as 6 categorias ajustando as notas antes de enviar"
  },
  community_reviews: {
    title: "Avaliações da Comunidade",
    load_older: "Carregar avaliações antigas"
  },
  categories: {
    grammar: { label: "Gramática & Mecânica", desc: "Ortografia, pontuação, sintaxe" },
    style: { label: "Estilo & Voz", desc: "Estilo de escrita, tom, escolha de palavras" },
    clarity: { label: "Clareza & Fluxo", desc: "Estrutura de frase, transições" },
    structure: { label: "Estrutura & Organização", desc: "Fluxo lógico, parágrafos" },
    content: { label: "Conteúdo & Ideias", desc: "Força do argumento, evidência, profundidade" },
    research: { label: "Pesquisa & Evidência", desc: "Fontes, citações, suporte" }
  },
  toast: {
    cannot_review: "Não é possível avaliar",
    cannot_review_own: "Você não pode avaliar sua própria redação.",
    comment_added: "Comentário adicionado",
    comment_saved: "Seu comentário foi salvo com sucesso.",
    comment_failed: "Falha ao adicionar comentário",
    missing_info: "Informação faltando",
    missing_comment: "Por favor, adicione um comentário.",
    incomplete: "Avaliação incompleta",
    incomplete_desc: "Por favor, complete todas as seis notas de categoria antes de enviar.",
    submitted: "Avaliação enviada",
    submitted_desc: "Sua avaliação foi salva com sucesso.",
    submitted_locked: "Sua avaliação foi bloqueada e enviada com sucesso.",
    submit_failed: "Falha ao enviar avaliação"
  }
},
user_profile: {
  header: {
    display_name_placeholder: "Nome de Exibição",
    username_placeholder: "Usuário",
    bio_placeholder: "Conte-nos sobre você...",
    no_bio: "Sem bio ainda. Clique em editar para adicionar!",
    save: "Salvar",
    saving: "Salvando...",
    edit: "Editar"
  },
  tabs: {
    messages: "Mensagens",
    friends: "Amigos",
    discover: "Descobrir",
    settings: "Configurações"
  },
  messages: {
    title: "Conversas",
    empty: "Selecione uma conversa para começar a bater papo"
  },
  friends: {
    title: "Amigos e Solicitações",
    no_friends: "Sem amigos ainda",
    connect_hint: "Conecte-se com outros escritores na comunidade",
    pending: "Pendente",
    accepted: "Amigos"
  },
  discover: {
    title: "Descobrir Escritores",
    search_placeholder: "Buscar por nome ou usuário...",
    no_results: "Nenhum usuário encontrado para sua busca",
    no_users: "Nenhum usuário para descobrir ainda",
    load_more: "Carregar Mais Perfis",
    end_list: "Fim da lista",
    connect: "Conectar"
  },
  settings: {
    title: "Configurações",
    appearance: {
      title: "Aparência",
      theme: "Tema",
      theme_desc: "Escolha seu tema de cores preferido"
    },
    preferences: {
      title: "Preferências",
      language: "Idioma",
      language_desc: "Selecione o idioma da interface"
    },
    account: {
      title: "Conta",
      sign_out: "Sair da Conta"
    }
  },
  toast: {
    new_connection: "Nova Conexão",
    new_connection_desc: "Você recebeu uma nova solicitação de amizade!",
    request_accepted: "Solicitação de Amizade Aceita",
    profile_updated: "Perfil atualizado",
    profile_updated_desc: "Seu perfil foi salvo com sucesso.",
    update_failed: "Falha na atualização",
    update_failed_desc: "Falha ao atualizar perfil. Tente novamente.",
    friendship_accepted: "Você aceitou a amizade",
    friendship_accepted_desc: "Vocês agora são amigos!",
    request_sent: "Solicitação enviada",
    request_sent_desc: "Sua solicitação de amizade foi enviada com sucesso!",
    request_failed: "Falha na solicitação",
    request_failed_desc: "Falha ao enviar solicitação. Tente novamente."
  }
},
conversations: {
  empty: {
    title: "Nenhuma conversa ainda",
    desc: "Comece uma conversa visitando o perfil de um usuário"
  }
},
thread: {
  placeholder: "Mensagem para {{name}}...",
  no_messages: "Nenhuma mensagem ainda. Comece a conversa!",
  typing_hint: "Pressione Enter para enviar, Shift+Enter para nova linha",
  toast: {
    send_failed: "Falha ao enviar",
    send_failed_desc: "Não foi possível enviar sua mensagem. Tente novamente."
  }
}
}
      }
    }
  }


);

export default i18n;