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
  topic_description: "Topic Description",
  header: "Essay Editor",
  saving: "Saving...",
  save: "Save",
  words: "{{count}} words",
  analyze: "Analyze",
  analyzing: "Analyzing...",
  untitled: "Untitled Essay",
  topic_context: "Writing for topic:",
  back: "Back",
  submit_topic: "Submit to Topic",
  submitting: "Submitting...",
  template_mode: "Template Mode",
  exit_template: "Exit Template",
  rubric_label: "Scoring Rubric: {{name}}",
  rubric_desc: "AI and community reviewers will score your essay on these categories.",
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
    content_req_desc: "Please add a title and content before analyzing.",
    submitted_title: "Essay submitted!",
    submitted_desc: "Your essay has been submitted for review.",
    submit_failed_title: "Submission failed",
    submit_failed_desc: "Failed to submit essay. Please try again.",
    submit_req_desc: "Please add a title and content before submitting."
  },
  essay_type_select: "Select essay type",
  types: {
    compare_contrast: "Compare & Contrast",
    argumentative: "Argumentative",
    narrative: "Narrative",
    descriptive: "Descriptive",
    expository: "Expository",
    persuasive: "Persuasive",
    creative: "Creative",
    analytical: "Analytical",
    reflective: "Reflective",
    academic: "Academic",
    business: "Business",
    technical: "Technical",
    other: "Other"
  },
},
explore: {
  header: {
    title: "Explore",
    subtitle: "Discover writing resources, topics, and templates",
    create_btn: "Create"
  },
  search_placeholder: "Search...",
  
  load_more: "Load More",
  loading: "Loading...",

  filters: {
    all: "All",
    my_content: "My Content",
    saved: "Saved",
    category_list: "Categories",
    essay_topic: "Topics",
    quote: "Quotes",
    template: "Templates"
  },
  types: {
    category_list: "Categories",
    essay_topic: "Topic",
    quote: "Quote",
    template: "Template"
  },
  card: {
    featured: "Featured",
    total_points: "Total: {{score}} points",
    copy: "Copy Quote",
    blanks: "{{count}} blanks",
    more: "+{{count}} more"
  },
  detail: {
    use_this: "Use This",
    delete: "Delete",
    max_score: "Max: {{score}} points",
    no_desc: "No description provided."
  },
  create: {
    title: "Create New Content",
    desc: "Add content for others to discover and use.",
    template_help: "Use [brackets] for fill-in sections, e.g., \"The [topic] is important because [reason].\"",
    labels: {
      type: "Content Type",
      title: "Title",
      quote_text: "Quote Text",
      subtitle: "Subtitle (optional)",
      desc: "Description",
      author: "Author",
      source: "Source (optional)",
      template: "Template Content",
      categories: "Categories",
      essay_type_optional: "Essay Type (Optional)",
      scoring_categories: "Scoring Categories",
      preview: "Preview:"
    },
    placeholders: {
      title: "Enter a title...",
      quote: "Enter the quote...",
      subtitle: "Brief description...",
      desc: "Describe the topic in detail...",
      author: "Who said this?",
      source: "Book, speech, interview...",
      template: "Write your template. Use [PLACEHOLDER] for gaps users will fill in.",
      category_name: "Category name",
      score: "Max",
      select_essay_type_rubric: "Select essay type for this rubric"
    },
    hint: "Tip: Use [BRACKETS] to mark areas users should fill in.",
    add_category: "Add Category",
    cancel: "Cancel",
    submit: "Create",
    submitting: "Creating..."
  },
  empty: {
    title: "No content found",
    desc_search: "Try adjusting your search or filters.",
    desc_default: "Be the first to add content!",
    btn_create: "Create Content"
  },
  
  toast: {
    created: "Created!",
    created_desc: "Your content has been added to Explore.",
    create_failed: "Failed",
    create_failed_desc: "Could not create content.",
    deleted: "Deleted",
    deleted_desc: "Content removed.",
    copied: "Copied!",
    copied_desc: "Quote copied to clipboard.",
    incomplete: "Incomplete",
    incomplete_desc: "Please fill in all required fields.",
    topic_loaded: "Topic loaded",
    topic_loaded_desc: "Start writing your essay on this topic!",
    template_loaded: "Template loaded",
    template_loaded_desc: "Fill in the template to write your essay!",
    rubric_selected: "Rubric selected",
    rubric_desc: "Your essay will be scored on: {{categories}}"
  }
}, 
library: {
  community_filter: {
    placeholder: "Filter by community",
    all: "All Communities"
  },
  alert: {
    delete_title: "Delete Essay?",
    delete_desc: "This will permanently delete \"{{title}}\". This action cannot be undone.",
    cancel: "Cancel",
    confirm: "Delete"
  },
  header: {
    title: "My Essay Library",
    subtitle: "Manage and review your written essays"
  },
  search_placeholder: "Search essays...",
  new_essay: "New Essay",
  filters: {
    all: "All Essays",
    drafts: "Drafts",
    communities: "Communities",
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
    confirm_delete: "Are you sure you want to delete this essay? This action cannot be undone.",
    publish_tooltip: "Publish to Community",
    archive_tooltip: "Archive (Make Private)"
  },
  empty: {
    title: "No essays found",
    no_community_essays: "No essays found in your communities",
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
community_feed: {
  tabs: {
    essays: "Essays",
    communities: "Communities"
  },
  essays: {
    title: "Community Essays",
    subtitle: "Discover and learn from essays shared by other writers",
    no_essays: "No community essays yet",
    be_first: "Be the first to share your essay with the community!",
    load_more: "Load More Essays",
    end_of_list: "You've reached the end of the list"
  },
  communities: {
    title: "Writing Communities",
    subtitle: "Join communities to write essays on shared topics",
    create_btn: "Create Community",
    search_placeholder: "Search communities...",
    no_communities: "No communities yet",
    be_first_community: "Be the first to create a writing community!",
    back_btn: "Back to Communities",
    no_description: "No description",
    filters: {
      all: "All Communities",
      member: "My Communities",
      all_topics: "All",
      technology: "Technology",
      science: "Science",
      literature: "Literature",
      environment: "Environment",
      general: "General",
      sort_recent: "Most Recent",
      sort_popular: "Most Popular",
      sort_rated: "Highest Rated"
    },
    card: {
      public: "Public",
      private: "Private",
      leader: "Leader",
      member: "Member",
      members_count: "{{count}} members",
      led_by: "Led by {{name}}",
      pending: "Pending",
      join: "Join",
      request_join: "Request to Join",
      min_read: "min read",
      words: "words"
    }
  },
  detail: {
    share_code: "Share Code:",
    code_copied: "Code copied!",
    code_copied_desc: "Share this code with others to join your community.",
    transfer_leadership: "Transfer Leadership",
    leave: "Leave",
    topics_title: "Topics",
    create_topic: "Create Topic",
    members_title: "Members ({{count}})",
    leader_badge: "Leader",
    primary_leader: "Primary Leader",
    promote: "Promote",
    demote: "Demote",
    pending_requests: "Pending Join Requests ({{count}})",
    no_pending: "No pending requests",
    requested_on: "Requested {{date}}",
    approve: "Approve",
    reject: "Reject"
  },
  topic: {
    back_btn: "Back to Community",
    active: "Active",
    closed: "Closed",
    due_date: "Due {{date}}",
    submissions_count: "{{count}} submissions",
    leader_dashboard: "Leader Dashboard",
    empty: {
      no_topics: "No topics yet",
      create_first: "Create the first topic for your community members to write about.",
      leader_hasnt_created: "The community leader hasn't created any topics yet.",
      no_members_track: "No members to track yet. Invite others to join!"
    },
    stats: {
      submission_rate: "Submission Rate",
      avg_words: "Average Word Count",
      review_status: "Review Status",
      time_review: "Time to Review",
      words_per_essay: "words per essay",
      reviewed: "reviewed",
      pending_essays: "{{count}} essays pending",
      done: "Done!",
      not_submitted: "Not Yet Submitted ({{count}})"
    },
    submit_panel: {
      title: "Submit Your Essay",
      desc: "Write an essay for this topic",
      btn: "Write Essay",
      submitted_msg: "You have submitted an essay for this topic"
    },
    submissions_list: {
      title: "Submissions",
      title_leader: "Submitted",
      no_submissions: "No submissions yet",
      be_first: "Be the first to submit an essay for this topic!",
      pending_review: "Pending Review",
      reviewed: "Reviewed",
      view_essay: "View Essay →"
    }
  },
  dialogs: {
    create_community: {
      title: "Create a New Community",
      desc: "Create a community where you can post essay topics for members to write about.",
      name_label: "Community Name",
      name_placeholder: "Enter community name",
      desc_label: "Description (optional)",
      desc_placeholder: "Describe what your community is about",
      type_label: "Community Type",
      public_desc: "Anyone can join",
      private_desc: "Requires approval to join",
      cancel: "Cancel",
      create: "Create Community",
      creating: "Creating..."
    },
    create_topic: {
      title: "Create a New Topic",
      desc: "Create a topic for your community members to write about.",
      title_label: "Topic Title",
      title_placeholder: "Enter topic title",
      desc_label: "Description (optional)",
      desc_placeholder: "Describe what you want members to write about",
      deadline_label: "Deadline (optional)",
      cancel: "Cancel",
      create: "Create Topic",
      creating: "Creating..."
    },
    transfer: {
      title: "Transfer Primary Leadership",
      desc: "Select a member to become the new primary leader. You will become a regular member after transferring.",
      current_leader: "Current Leader",
      cancel: "Cancel",
      confirm: "Transfer Leadership"
    }
  },
  toast: {
    topic_created: "Topic created",
    topic_desc: "Your topic has been created for community members to write about!",
    topic_failed: "Creation failed",
    topic_failed_desc: "Failed to create topic. Please try again.",
    reviewed: "Marked as reviewed",
    reviewed_desc: "The submission has been marked as reviewed.",
    review_failed: "Review failed",
    review_failed_desc: "Failed to mark as reviewed. Please try again.",
    action_failed: "Action failed",
    like_failed_desc: "Failed to update like. Please try again.",
    comm_created: "Community created",
    comm_created_desc: "Your community has been created successfully!",
    comm_failed: "Creation failed",
    comm_failed_desc: "Failed to create community. Please try again.",
    request_sent: "Request sent",
    request_sent_desc: "Your request to join has been sent to the leader for approval.",
    joined: "Joined community",
    joined_desc: "You have joined the community!",
    join_failed: "Join failed",
    join_failed_desc: "Failed to join community. Please try again.",
    left: "Left community",
    left_desc: "You have left the community.",
    leave_failed: "Leave failed",
    leave_failed_desc: "Failed to leave community. Please try again.",
    req_approved: "Request approved",
    req_approved_desc: "The user has been added to the community.",
    approve_failed_desc: "Failed to approve request.",
    req_rejected: "Request rejected",
    req_rejected_desc: "The join request has been rejected.",
    reject_failed_desc: "Failed to reject request.",
    promoted: "Member promoted",
    promoted_desc: "The member is now a leader.",
    promote_failed_desc: "Failed to promote member.",
    demoted: "Leader demoted",
    demoted_desc: "The leader is now a regular member.",
    demote_failed_desc: "Failed to demote leader.",
    transferred: "Leadership transferred",
    transferred_desc: "You have transferred primary leadership to another member.",
    transfer_failed_desc: "Failed to transfer leadership."
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
},
welcome: {
  header: {
    login: "Log In",
    get_started: "Get Started"
  },
  hero: {
    badge: "AI-Powered Writing Assistant",
    title: "Write Better Essays,",
    title_highlight: "Together",
    subtitle: "Get instant AI feedback, discover writing resources, and collaborate with a community of writers to improve your craft.",
    cta_primary: "Start Writing",
    cta_secondary: "Learn More"
  },
  features: {
    title: "Everything You Need to Write",
    subtitle: "From drafting to polishing, Essay AI supports your entire writing journey.",
    editor: {
      title: "Smart Essay Editor",
      desc: "Write your essays with a clean, distraction-free editor. Save drafts, organize your work, and pick up right where you left off.",
      check1: "Auto-save and draft management",
      check2: "Personal essay library"
    },
    ai: {
      title: "AI-Powered Analysis",
      desc: "Get instant, detailed feedback on grammar, style, clarity, and structure. Understand your strengths and where to improve.",
      check1: "Grammar and style corrections",
      check2: "Custom rubric scoring"
    },
    explore: {
      title: "Explore Resources",
      desc: "Browse a community-driven library of topics, templates, quotes, and scoring rubrics to kickstart your writing.",
      check1: "Essay topics and prompts",
      check2: "Fill-in-the-blank templates"
    },
    community: {
      title: "Community & Peer Review",
      desc: "Share your essays with a supportive community. Give and receive feedback, like your favorites, and grow together.",
      check1: "Peer corrections and suggestions",
      check2: "Community engagement with likes"
    }
  },
  how_it_works: {
    title: "How It Works",
    subtitle: "Three simple steps to better writing",
    step1_title: "Write Your Essay",
    step1_desc: "Use the editor or start from a template. Pick a topic from the Explore page to get inspired.",
    step2_title: "Get AI Feedback",
    step2_desc: "Submit your essay for analysis. Receive detailed corrections with scores based on your chosen rubric.",
    step3_title: "Share & Improve",
    step3_desc: "Publish to the community, get peer reviews, and refine your writing with every iteration."
  },
  cta_section: {
    title: "Ready to Write Your Best Essay?",
    desc: "Join a community of writers who are improving their craft with AI-powered feedback and peer collaboration.",
    btn: "Get Started Now"
  },
  footer: {
    tagline: "Write better. Write together."
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
  topic_description: "Descrição do Tópico",
  saving: "Salvando...",
  header: "Editor",
  words: "{{count}} palavras",
  analyze: "Analisar",
  analyzing: "Analisando...",
  untitled: "Redação Sem Título",
  topic_context: "Escrevendo para o tópico:",
  back: "Voltar",
  submit_topic: "Enviar para o Tópico",
  submitting: "Enviando...",
  template_mode: "Modo Modelo",
  exit_template: "Sair do Modelo",
  save: "Salvar",
  rubric_label: "Rubrica de Avaliação: {{name}}",
  rubric_desc: "A IA e os revisores da comunidade avaliarão sua redação nestas categorias.",
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
    content_req_desc: "Por favor, adicione título e conteúdo antes de analisar.",
    submitted_title: "Redação enviada!",
    submitted_desc: "Sua redação foi enviada para revisão.",
    submit_failed_title: "Falha no envio",
    submit_failed_desc: "Falha ao enviar redação. Tente novamente.",
    submit_req_desc: "Por favor, adicione título e conteúdo antes de enviar."
  },
  essay_type_select: "Selecione o tipo",
  types: {
    compare_contrast: "Comparativa",
    argumentative: "Argumentativa",
    narrative: "Narrativa",
    descriptive: "Descritiva",
    expository: "Expositiva",
    persuasive: "Persuasiva",
    creative: "Criativa",
    analytical: "Analítica",
    reflective: "Reflexiva",
    academic: "Acadêmica",
    business: "Empresarial",
    technical: "Técnica",
    other: "Outro"
  },
},
explore: {
  header: {
    title: "Explorar",
    subtitle: "Descubra recursos de escrita, tópicos e modelos",
    create_btn: "Criar"
  },
  search_placeholder: "Buscar...",
  
  load_more: "Carregar Mais",
  loading: "Carregando...",

  filters: {
    all: "Todos",
    my_content: "Meus Conteúdos",
    saved: "Salvos",
    category_list: "Categorias",
    essay_topic: "Tópicos",
    quote: "Citações",
    template: "Modelos"
  },
  types: {
    category_list: "Categorias",
    essay_topic: "Tópico",
    quote: "Citação",
    template: "Modelo"
  },
  card: {
    featured: "Destaque",
    total_points: "Total: {{score}} pontos",
    copy: "Copiar Citação",
    blanks: "{{count}} lacunas",
    more: "+{{count}} mais"
  },
  detail: {
    use_this: "Usar Isto",
    delete: "Excluir",
    max_score: "Máx: {{score}} pontos",
    no_desc: "Nenhuma descrição fornecida."
  },
  create: {
    title: "Criar Novo Conteúdo",
    desc: "Adicione conteúdo para outros descobrirem e usarem.",
    template_help: "Use [colchetes] para seções de preenchimento, ex: \"O [tópico] é importante porque [motivo].\"",
    labels: {
      type: "Tipo de Conteúdo",
      title: "Título",
      quote_text: "Texto da Citação",
      subtitle: "Subtítulo (opcional)",
      desc: "Descrição",
      author: "Autor",
      source: "Fonte (opcional)",
      template: "Conteúdo do Modelo",
      categories: "Categorias",
      essay_type_optional: "Tipo de Redação (Opcional)",
      scoring_categories: "Categorias de Avaliação",
      preview: "Pré-visualização:"
    },
    placeholders: {
      title: "Digite um título...",
      quote: "Digite a citação...",
      subtitle: "Breve descrição...",
      desc: "Descreva o tópico em detalhes...",
      author: "Quem disse isso?",
      source: "Livro, discurso, entrevista...",
      template: "Escreva seu modelo. Use [PLACEHOLDER] para lacunas.",
      category_name: "Nome da categoria",
      score: "Máx",
      select_essay_type_rubric: "Selecione o tipo de redação para esta rubrica"
    },
    hint: "Dica: Use [COLCHETES] para marcar áreas que os usuários devem preencher.",
    add_category: "Adicionar Categoria",
    cancel: "Cancelar",
    submit: "Criar",
    submitting: "Criando..."
  },
  empty: {
    title: "Nenhum conteúdo encontrado",
    desc_search: "Tente ajustar sua busca ou filtros.",
    desc_default: "Seja o primeiro a adicionar conteúdo!",
    btn_create: "Criar Conteúdo"
  },
  
  toast: {
    created: "Criado!",
    created_desc: "Seu conteúdo foi adicionado ao Explorar.",
    create_failed: "Falha",
    create_failed_desc: "Não foi possível criar o conteúdo.",
    deleted: "Excluído",
    deleted_desc: "Conteúdo removido.",
    copied: "Copiado!",
    copied_desc: "Citação copiada para a área de transferência.",
    incomplete: "Incompleto",
    incomplete_desc: "Por favor, preencha todos os campos obrigatórios.",
    topic_loaded: "Tópico carregado",
    topic_loaded_desc: "Comece a escrever sua redação sobre este tópico!",
    template_loaded: "Modelo carregado",
    template_loaded_desc: "Preencha o modelo para escrever sua redação!",
    rubric_selected: "Rubrica selecionada",
    rubric_desc: "Sua redação será avaliada em: {{categories}}"
  }
},
library: {
  community_filter: {
    placeholder: "Filtrar por comunidade",
    all: "Todas as Comunidades"
  },
  alert: {
    delete_title: "Excluir Redação?",
    delete_desc: "Isso excluirá permanentemente \"{{title}}\". Esta ação não pode ser desfeita.",
    cancel: "Cancelar",
    confirm: "Excluir"
  },
  header: {
    title: "Minha Biblioteca",
    subtitle: "Gerencie e revise suas redações"
  },
  search_placeholder: "Buscar redações...",
  new_essay: "Nova Redação",
  filters: {
    all: "Todas",
    drafts: "Rascunhos",
    communities: "Comunidades",
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
    confirm_delete: "Tem certeza que deseja excluir esta redação? Esta ação não pode ser desfeita.",
    publish_tooltip: "Tornar Público na Comunidade",
    archive_tooltip: "Arquivar (Tornar Privado)"
  },
  empty: {
    title: "Nenhuma redação encontrada",
    desc_search: "Tente ajustar seus termos de busca.",
    desc_default: "Comece a escrever sua primeira redação!",
    no_community_essays: "Nenhuma redação encontrada em suas comunidades",
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
community_feed: {
  tabs: {
    essays: "Redações",
    communities: "Comunidades"
  },
  essays: {
    title: "Redações da Comunidade",
    subtitle: "Descubra e aprenda com redações compartilhadas por outros escritores",
    no_essays: "Nenhuma redação da comunidade ainda",
    be_first: "Seja o primeiro a compartilhar sua redação com a comunidade!",
    load_more: "Carregar Mais Redações",
    end_of_list: "Você chegou ao fim da lista"
  },
  communities: {
    title: "Comunidades de Escrita",
    subtitle: "Junte-se a comunidades para escrever sobre tópicos compartilhados",
    create_btn: "Criar Comunidade",
    search_placeholder: "Buscar comunidades...",
    no_communities: "Nenhuma comunidade ainda",
    be_first_community: "Seja o primeiro a criar uma comunidade de escrita!",
    back_btn: "Voltar para Comunidades",
    no_description: "Sem descrição",
    filters: {
      all: "Todas",
      member: "Minhas Comunidades",
      all_topics: "Todos",
      technology: "Tecnologia",
      science: "Ciência",
      literature: "Literatura",
      environment: "Meio Ambiente",
      general: "Geral",
      sort_recent: "Mais Recentes",
      sort_popular: "Mais Populares",
      sort_rated: "Mais Bem Avaliadas"
    },
    card: {
      public: "Pública",
      private: "Privada",
      leader: "Líder",
      member: "Membro",
      members_count: "{{count}} membros",
      led_by: "Liderada por {{name}}",
      pending: "Pendente",
      join: "Entrar",
      request_join: "Solicitar Entrada",
      min_read: "min de leitura",
      words: "palavras",
    }
  },
  detail: {
    share_code: "Código:",
    code_copied: "Código copiado!",
    code_copied_desc: "Compartilhe este código com outros para entrarem na sua comunidade.",
    transfer_leadership: "Transferir Liderança",
    leave: "Sair",
    topics_title: "Tópicos",
    create_topic: "Criar Tópico",
    members_title: "Membros ({{count}})",
    leader_badge: "Líder",
    primary_leader: "Líder Principal",
    promote: "Promover",
    demote: "Rebaixar",
    pending_requests: "Solicitações Pendentes ({{count}})",
    no_pending: "Nenhuma solicitação pendente",
    requested_on: "Solicitado em {{date}}",
    approve: "Aprovar",
    reject: "Rejeitar"
  },
  topic: {
    back_btn: "Voltar para Comunidade",
    active: "Ativo",
    closed: "Fechado",
    due_date: "Vence em {{date}}",
    submissions_count: "{{count}} envios",
    leader_dashboard: "Painel do Líder",
    empty: {
      no_topics: "Nenhum tópico ainda",
      create_first: "Crie o primeiro tópico para os membros da sua comunidade escreverem.",
      leader_hasnt_created: "O líder da comunidade ainda não criou nenhum tópico.",
      no_members_track: "Nenhum membro para acompanhar ainda. Convide outros para participar!"
    },
    stats: {
      submission_rate: "Taxa de Envio",
      avg_words: "Média de Palavras",
      review_status: "Status de Revisão",
      time_review: "Tempo para Revisar",
      words_per_essay: "palavras por redação",
      reviewed: "revisados",
      pending_essays: "{{count}} redações pendentes",
      done: "Pronto!",
      not_submitted: "Não Enviaram ({{count}})"
    },
    submit_panel: {
      title: "Envie sua Redação",
      desc: "Escreva uma redação para este tópico",
      btn: "Escrever Redação",
      submitted_msg: "Você já enviou uma redação para este tópico"
    },
    submissions_list: {
      title: "Envios",
      title_leader: "Enviados",
      no_submissions: "Nenhum envio ainda",
      be_first: "Seja o primeiro a enviar uma redação para este tópico!",
      pending_review: "Aguardando Revisão",
      reviewed: "Revisado",
      view_essay: "Ver Redação →"
    }
  },
  dialogs: {
    create_community: {
      title: "Criar Nova Comunidade",
      desc: "Crie uma comunidade onde você pode postar tópicos para os membros escreverem.",
      name_label: "Nome da Comunidade",
      name_placeholder: "Digite o nome da comunidade",
      desc_label: "Descrição (opcional)",
      desc_placeholder: "Descreva sobre o que é sua comunidade",
      type_label: "Tipo de Comunidade",
      public_desc: "Qualquer um pode entrar",
      private_desc: "Requer aprovação para entrar",
      cancel: "Cancelar",
      create: "Criar Comunidade",
      creating: "Criando..."
    },
    create_topic: {
      title: "Criar Novo Tópico",
      desc: "Crie um tópico para os membros da sua comunidade escreverem sobre.",
      title_label: "Título do Tópico",
      title_placeholder: "Digite o título do tópico",
      desc_label: "Descrição (opcional)",
      desc_placeholder: "Descreva sobre o que você quer que escrevam",
      deadline_label: "Prazo (opcional)",
      cancel: "Cancelar",
      create: "Criar Tópico",
      creating: "Criando..."
    },
    transfer: {
      title: "Transferir Liderança Principal",
      desc: "Selecione um membro para se tornar o novo líder principal. Você se tornará um membro comum após transferir.",
      current_leader: "Líder Atual",
      cancel: "Cancelar",
      confirm: "Transferir Liderança"
    }
  },
  toast: {
    topic_created: "Tópico criado",
    topic_desc: "Seu tópico foi criado para os membros da comunidade!",
    topic_failed: "Falha na criação",
    topic_failed_desc: "Falha ao criar tópico. Tente novamente.",
    reviewed: "Marcado como revisado",
    reviewed_desc: "O envio foi marcado como revisado.",
    review_failed: "Falha na revisão",
    review_failed_desc: "Falha ao marcar como revisado. Tente novamente.",
    action_failed: "Ação falhou",
    like_failed_desc: "Falha ao atualizar curtida. Tente novamente.",
    comm_created: "Comunidade criada",
    comm_created_desc: "Sua comunidade foi criada com sucesso!",
    comm_failed: "Falha na criação",
    comm_failed_desc: "Falha ao criar comunidade. Tente novamente.",
    request_sent: "Solicitação enviada",
    request_sent_desc: "Sua solicitação foi enviada para aprovação do líder.",
    joined: "Entrou na comunidade",
    joined_desc: "Você entrou na comunidade!",
    join_failed: "Falha ao entrar",
    join_failed_desc: "Falha ao entrar na comunidade. Tente novamente.",
    left: "Saiu da comunidade",
    left_desc: "Você saiu da comunidade.",
    leave_failed: "Falha ao sair",
    leave_failed_desc: "Falha ao sair da comunidade. Tente novamente.",
    req_approved: "Solicitação aprovada",
    req_approved_desc: "O usuário foi adicionado à comunidade.",
    approve_failed_desc: "Falha ao aprovar solicitação.",
    req_rejected: "Solicitação rejeitada",
    req_rejected_desc: "A solicitação de entrada foi rejeitada.",
    reject_failed_desc: "Falha ao rejeitar solicitação.",
    promoted: "Membro promovido",
    promoted_desc: "O membro agora é um líder.",
    promote_failed_desc: "Falha ao promover membro.",
    demoted: "Líder rebaixado",
    demoted_desc: "O líder agora é um membro comum.",
    demote_failed_desc: "Falha ao rebaixar líder.",
    transferred: "Liderança transferida",
    transferred_desc: "Você transferiu a liderança principal para outro membro.",
    transfer_failed_desc: "Falha ao transferir liderança."
  }
},
nav: {
  write: "Escrever",
  library: "Biblioteca",
  explore: "Explorar",
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
},
welcome: {
  header: {
    login: "Entrar",
    get_started: "Começar"
  },
  hero: {
    badge: "Assistente de Escrita com IA",
    title: "Escreva Redações Melhores,",
    title_highlight: "Juntos",
    subtitle: "Receba feedback instantâneo da IA, descubra recursos de escrita e colabore com uma comunidade de escritores para melhorar sua técnica.",
    cta_primary: "Começar a Escrever",
    cta_secondary: "Saiba Mais"
  },
  features: {
    title: "Tudo o Que Você Precisa para Escrever",
    subtitle: "Do rascunho ao polimento, o Essay AI apoia toda a sua jornada de escrita.",
    editor: {
      title: "Editor de Redação Inteligente",
      desc: "Escreva suas redações com um editor limpo e sem distrações. Salve rascunhos, organize seu trabalho e continue de onde parou.",
      check1: "Salvamento automático e gestão de rascunhos",
      check2: "Biblioteca pessoal de redações"
    },
    ai: {
      title: "Análise Potencializada por IA",
      desc: "Obtenha feedback instantâneo e detalhado sobre gramática, estilo, clareza e estrutura. Entenda seus pontos fortes e onde melhorar.",
      check1: "Correções de gramática e estilo",
      check2: "Pontuação com rubrica personalizada"
    },
    explore: {
      title: "Explore Recursos",
      desc: "Navegue por uma biblioteca comunitária de tópicos, modelos, citações e rubricas de avaliação para impulsionar sua escrita.",
      check1: "Tópicos e sugestões de redação",
      check2: "Modelos de preenchimento de lacunas"
    },
    community: {
      title: "Comunidade e Revisão por Pares",
      desc: "Compartilhe suas redações com uma comunidade solidária. Dê e receba feedback, curta seus favoritos e cresçam juntos.",
      check1: "Correções e sugestões de colegas",
      check2: "Engajamento da comunidade com curtidas"
    }
  },
  how_it_works: {
    title: "Como Funciona",
    subtitle: "Três passos simples para escrever melhor",
    step1_title: "Escreva Sua Redação",
    step1_desc: "Use o editor ou comece a partir de um modelo. Escolha um tópico na página Explorar para se inspirar.",
    step2_title: "Receba Feedback da IA",
    step2_desc: "Envie sua redação para análise. Receba correções detalhadas com notas baseadas na rubrica escolhida.",
    step3_title: "Compartilhe e Melhore",
    step3_desc: "Publique para a comunidade, receba avaliações de pares e refine sua escrita a cada iteração."
  },
  cta_section: {
    title: "Pronto para Escrever Sua Melhor Redação?",
    desc: "Junte-se a uma comunidade de escritores que estão melhorando sua técnica com feedback de IA e colaboração entre pares.",
    btn: "Comece Agora"
  },
  footer: {
    tagline: "Escreva melhor. Escreva juntos."
  }
}
}
      }
    }
  }


);

export default i18n;