-- Seed marketing_skills with 34 Marketing AI Agency skill entries
-- Covers: Copywriting, Paid Ads, SEO, Social Media, Email, Analytics, CRM, Video, Design, Strategy

INSERT INTO public.marketing_skills (skill_key, department, title_en, title_ar, description_en, content) VALUES

-- ── COPYWRITING ────────────────────────────────────────────────
('copywriting_real_estate_arabic', 'Copywriting', 'Real Estate Copywriting (Arabic)', 'كتابة الإعلانات العقارية بالعربية',
 'Craft compelling Arabic real estate ad copy for Egyptian market',
 'اكتب نصوص إعلانية عقارية احترافية باللغة العربية تستهدف المشترين المصريين. ركز على المساحة، الموقع، العائد الاستثماري، والمرافق. استخدم لغة حماسية تبث الثقة وتحفز على اتخاذ القرار. يجب أن يحتوي الإعلان على: العنوان الجذاب، المميزات الرئيسية، السعر (إن وجد)، ودعوة واضحة للتصرف.'),

('copywriting_headlines', 'Copywriting', 'Headline Generator', 'توليد عناوين إعلانية',
 'Generate 5 high-converting headlines for real estate ads',
 'ولّد 5 عناوين إعلانية قوية ومتنوعة لعقارات مصرية. استخدم تقنيات: الرقم (أرخص 3 شقق)، السؤال (هل تريد؟)، الفائدة المباشرة (وفّر 30%)، FOMO (فرصة محدودة)، والضمان. كل عنوان لا يتجاوز 10 كلمات.'),

('copywriting_email_drip', 'Copywriting', 'Email Drip Sequence', 'تسلسل رسائل البريد الإلكتروني',
 'Write a 5-email nurturing sequence for real estate leads',
 'اكتب تسلسل 5 رسائل بريد إلكتروني لرعاية العملاء المحتملين في مجال العقارات: 1) الترحيب وتقديم القيمة، 2) محتوى تعليمي عن السوق، 3) عرض مشاريع مختارة، 4) شهادات عملاء وقصص نجاح، 5) عرض خاص ودعوة لحجز موعد. كل رسالة 150-200 كلمة.'),

('copywriting_social_arabic', 'Copywriting', 'Social Media Posts (Arabic)', 'منشورات وسائل التواصل الاجتماعي',
 'Create engaging Arabic social media posts for real estate',
 'اكتب منشور وسائل تواصل اجتماعي لعقار بالمواصفات المحددة. استخدم الهاشتاقات المناسبة، emoji محدودة ومناسبة، لغة محادثة طبيعية. تضمّن: الصورة المثالية الموصى بها، النص الرئيسي (80-120 حرف)، الهاشتاقات (5-8 هاشتاق عربي وإنجليزي).'),

('copywriting_whatsapp_template', 'Copywriting', 'WhatsApp Business Template', 'قالب رسالة واتساب',
 'Draft approved WhatsApp Business API templates for leads',
 'اكتب قالب رسالة واتساب للعملاء المحتملين يتوافق مع متطلبات Meta للموافقة. يجب أن يكون: واضحاً، ذو قيمة فورية، يحتوي متغيرات للتخصيص {{الاسم}}، {{المشروع}}، ولا يتجاوز 1024 حرف.'),

-- ── PAID ADS ──────────────────────────────────────────────────
('paid_ads_meta_real_estate', 'Paid Ads', 'Meta Ads for Real Estate', 'إعلانات ميتا للعقارات',
 'Create complete Meta Ads campaign structure for property sales',
 'أنشئ هيكل حملة Meta Ads كاملة لبيع عقارات مصرية: الهدف (Leads/Conversions)، الجمهور (أعمار 28-55، القاهرة والجيزة، اهتمامات: عقارات/استثمار)، الميزانية اليومية المقترحة، تنسيق الإعلان (Video/Carousel/Single Image)، الـ ad copy (Primary Text/Headline/Description)، والـ CTA المناسب.'),

('paid_ads_google_search', 'Paid Ads', 'Google Search Ads', 'إعلانات جوجل البحثية',
 'Build Google Search ad groups with keywords and ad copy',
 'أنشئ مجموعة إعلانات Google Search لعقار محدد. اقترح: الكلمات المفتاحية الرئيسية + السلبية، Match Types المناسبة، 3 headlines وصفية (30 حرف لكل منها)، 2 descriptions (90 حرف)، Extensions مناسبة (Sitelink, Callout, Location).'),

('paid_ads_remarketing', 'Paid Ads', 'Remarketing Campaign', 'حملة إعادة الاستهداف',
 'Design remarketing funnels for website visitors and leads',
 'صمم حملة إعادة استهداف (Remarketing) للزوار السابقين والعملاء المحتملين: تقسيم الجماهير حسب سلوك الزيارة، رسائل مخصصة لكل مرحلة (آداة الشراء vs باحث)، تكرار الإعلان المناسب، واستراتيجية الاستبعاد لتجنب التعب الإعلاني.'),

('paid_ads_tiktok', 'Paid Ads', 'TikTok Ads for Real Estate', 'إعلانات تيك توك العقارية',
 'Create TikTok ad concepts for property marketing',
 'أنشئ مفهوم إعلاني لتيك توك لتسويق عقار: Hook قوي في أول 3 ثواني، فيديو لا يتجاوز 30 ثانية، نص تراكبي، صوت/موسيقى مناسبة، CTA في النهاية. ركز على العرض البصري للعقار بأسلوب lifestyle.'),

-- ── SEO ────────────────────────────────────────────────────────
('seo_keyword_research', 'SEO', 'Keyword Research for Real Estate', 'بحث الكلمات المفتاحية العقارية',
 'Research high-intent real estate keywords for Egyptian market',
 'ابحث وصنّف الكلمات المفتاحية لموضوع عقاري محدد في السوق المصري: الكلمات عالية النية الشرائية (شقق للبيع + موقع محدد)، الكلمات المعلوماتية (دليل شراء عقار)، الكلمات المحلية (اسم الحي + العقار)، حجم البحث التقريبي، مستوى المنافسة، وأولوية الاستهداف.'),

('seo_on_page_arabic', 'SEO', 'On-Page SEO Optimization', 'تحسين SEO داخل الصفحة',
 'Optimize Arabic real estate page for search engines',
 'حسّن صفحة عقار للـ SEO: Title Tag (55-60 حرف يحتوي الكلمة المفتاحية)، Meta Description (150-160 حرف مع CTA)، H1-H6 هرمية صحيحة، Alt Text للصور، Internal Links مناسبة، Schema Markup لـ Real Estate، سرعة التحميل، ومعدل الارتداد.'),

('seo_local_seo', 'SEO', 'Local SEO for Real Estate Agency', 'SEO المحلي لوكالات العقارات',
 'Optimize for local search to dominate Egyptian market results',
 'حسّن الظهور المحلي لوكالة عقارات: تحسين Google Business Profile (الوصف، الصور، الـ posts)، الكلمات المفتاحية الجغرافية، NAP consistency عبر الإنترنت، بناء Citations محلية، تشجيع المراجعات، وتحسين Google Maps.'),

('seo_content_cluster', 'SEO', 'Content Cluster Strategy', 'استراتيجية مجموعات المحتوى',
 'Build topic clusters for real estate authority',
 'أنشئ استراتيجية Pillar Content + Cluster للسيطرة على موضوع عقاري: صفحة Pillar رئيسية شاملة، 8-12 مقالة Cluster مترابطة، بنية Internal Linking، خطة نشر شهرية، وقياس الـ Topical Authority.'),

-- ── EMAIL MARKETING ────────────────────────────────────────────
('email_newsletter_monthly', 'Email Marketing', 'Monthly Market Newsletter', 'نشرة السوق الشهرية',
 'Write a monthly real estate market newsletter',
 'اكتب نشرة بريد إلكتروني شهرية لمشتركي وكالة عقارية: ملخص أداء السوق، أبرز المشاريع الجديدة، نصيحة استثمارية، قصة نجاح عميل، عقارات مميزة، وإحصائية مفاجئة عن السوق. الطول: 400-600 كلمة، بتصميم HTML احترافي.'),

('email_lead_nurture_sequence', 'Email Marketing', 'Lead Nurture Automation', 'أتمتة رعاية العملاء',
 'Design automated lead nurture email flow',
 'صمم تدفق أتمتة بريد إلكتروني لرعاية العملاء المحتملين: Trigger conditions، Timing بين الرسائل، Content per stage (Awareness/Consideration/Decision)، A/B testing المقترح، Segmentation rules، وKPIs للقياس (Open Rate/CTR/Conversion).'),

('email_reengagement', 'Email Marketing', 'Re-engagement Campaign', 'حملة إعادة التفاعل',
 'Win back cold leads with re-engagement email sequence',
 'أنشئ حملة لإعادة تفاعل العملاء المحتملين الخاملين (لم يتفاعلوا منذ 60+ يوماً): رسالة "هل ما زلت مهتماً؟" مع عرض قيمة جديد، متابعة بتحديث مشروع، رسالة "الفرصة الأخيرة" مع حافز حصري، ثم إزالة من القائمة إذا لم يتجاوب.'),

-- ── SOCIAL MEDIA ──────────────────────────────────────────────
('social_instagram_real_estate', 'Social Media', 'Instagram Strategy for Real Estate', 'استراتيجية إنستاقرام العقارية',
 'Create an Instagram content calendar for real estate',
 'صمم استراتيجية إنستاقرام شهرية لوكالة عقارية: تقسيم المحتوى (40% عقارات، 30% تعليمي، 20% خلف الكواليس، 10% ترفيهي)، أوقات النشر المثالية للجمهور المصري، قوالب Stories، استخدام Reels، التعاون مع مؤثرين، وقياس الأداء.'),

('social_linkedin_b2b', 'Social Media', 'LinkedIn B2B Real Estate', 'استراتيجية لينكدإن للعقارات',
 'Grow B2B real estate presence on LinkedIn',
 'طوّر حضوراً B2B على LinkedIn لوكالة عقارية: تحسين الملف الشخصي للشركة، محتوى Thought Leadership أسبوعي، بناء شبكة المستثمرين والمطورين، LinkedIn Ads للجمهور المهني، InMail templates للتواصل المباشر.'),

('social_youtube_property_tours', 'Social Media', 'YouTube Property Tours', 'جولات عقارية على يوتيوب',
 'Script and optimize YouTube property tour videos',
 'أنشئ سكريبت جولة عقارية ليوتيوب: Hook جذاب في 15 ثانية، مقدمة المشروع (30 ث)، جولة كاملة مع تعليق صوتي (3-5 دقائق)، ملخص المزايا، سعر وكيفية التواصل، End Screen مع Subscribe. مع: عنوان مُحسّن SEO، Description مع Timestamps، Tags مناسبة.'),

-- ── VIDEO & VISUAL ────────────────────────────────────────────
('video_heygen_avatar_script', 'Video', 'HeyGen Avatar Video Script', 'سكريبت فيديو HeyGen Avatar',
 'Write scripts for AI avatar property presentation videos',
 'اكتب سكريبت لفيديو تقديمي عقاري بـ HeyGen Avatar: افتتاحية قوية (5 ث)، تقديم المشروع (20 ث)، المزايا الرئيسية الثلاثة (30 ث)، العرض المالي (15 ث)، دعوة للتصرف (10 ث). الإجمالي: 80 ثانية. اللغة: عربية فصحى سهلة.'),

('video_property_showcase', 'Video', 'Property Showcase Video Brief', 'ملخص فيديو العرض العقاري',
 'Create detailed brief for property showcase video production',
 'أعد ملخصاً إنتاجياً لفيديو عرض عقار: Shot list مفصّل (Exterior → Entrance → Rooms → View → Amenities)، مقترحات الإضاءة، الموسيقى المناسبة (Classical/Modern Arabic)، مدة كل مشهد، النص الصوتي، والـ B-Roll المقترح.'),

('visual_ad_creative_brief', 'Video', 'Ad Creative Brief', 'ملخص التصميم الإبداعي',
 'Brief a designer on creating high-performing ad creatives',
 'أعد Creative Brief لمصمم إعلان عقاري: الهدف الإعلاني، الجمهور المستهدف، الرسالة الرئيسية، الألوان المقترحة (مع الكود الـ HEX)، الخطوط، العناصر البصرية المطلوبة، النص على الإعلان، المقاسات المطلوبة (Facebook/Instagram/Google Display/Story).'),

-- ── ANALYTICS ────────────────────────────────────────────────
('analytics_campaign_report', 'Analytics', 'Campaign Performance Report', 'تقرير أداء الحملات',
 'Analyze and report on digital marketing campaign results',
 'حلّل نتائج حملة تسويقية رقمية وأعد تقرير شامل: ملخص تنفيذي، KPIs الرئيسية (CTR/CPC/CPL/ROAS)، مقارنة بالفترة السابقة، تحليل الجمهور الأفضل أداءً، الإعلانات الأعلى والأدنى أداءً، الدروس المستفادة، وتوصيات لتحسين الحملة القادمة.'),

('analytics_attribution_model', 'Analytics', 'Attribution Modeling', 'نمذجة الإسناد التسويقي',
 'Build marketing attribution model for real estate conversions',
 'صمم نموذج إسناد تسويقي لمسار العميل في العقارات: تحديد touchpoints الرئيسية (إعلان → موقع → واتساب → اجتماع → بيع)، اختيار نموذج الإسناد المناسب (Last Click/Linear/Time Decay)، حساب تكلفة اكتساب العميل الحقيقية per channel، وتوزيع الميزانية بناءً على ROAS.'),

('analytics_lead_scoring_model', 'Analytics', 'AI Lead Scoring Model', 'نموذج تقييم العملاء بالذكاء الاصطناعي',
 'Build behavioral lead scoring system for real estate CRM',
 'صمم نموذج تقييم العملاء المحتملين (Lead Scoring): النقاط الإيجابية (زيارة صفحة التسعير +10، تحميل بروشور +15، طلب موعد +25)، النقاط السلبية (عدم فتح 3 رسائل متتالية -5)، تصنيف الدرجات (Hot/Warm/Cold)، ومتى يجب تحويل العميل للمبيعات.'),

-- ── CRM & AUTOMATION ──────────────────────────────────────────
('crm_pipeline_setup', 'CRM', 'Sales Pipeline Configuration', 'إعداد خط مبيعات CRM',
 'Configure an optimal real estate sales pipeline in CRM',
 'صمم خط مبيعات عقاري مثالي في CRM: مراحل الخط (Lead Captured → Qualified → Site Visit → Offer Made → Contract → Won/Lost)، تعريف نقاط الانتقال بين المراحل، SLA لكل مرحلة، حقول البيانات المطلوبة، وقواعد التعيين التلقائي لمندوبي المبيعات.'),

('crm_automation_workflows', 'CRM', 'CRM Automation Workflows', 'تدفقات أتمتة CRM',
 'Design automated workflows for lead management',
 'صمم تدفقات عمل آلية في CRM: ترحيب فوري بالعميل الجديد، تذكير المبيعات بالمتابعة كل 48 ساعة، إرسال بروشور تلقائي بعد الزيارة، تنبيه المدير عند عدم المتابعة لـ 5 أيام، وتسجيل كل تفاعل في ملف العميل.'),

('crm_client_segmentation', 'CRM', 'Client Segmentation Strategy', 'استراتيجية تصنيف العملاء',
 'Segment real estate clients for personalized marketing',
 'صنّف قاعدة العملاء لتسويق مخصص: المشترون لأول مرة، المستثمرون، المغتربون، رجال الأعمال، المتقاعدون. لكل شريحة: احتياجاتهم، رسائل التسويق المناسبة، القنوات المفضلة، ونوع العقار الأنسب. مع نموذج بيانات للتصنيف التلقائي.'),

-- ── CONTENT STRATEGY ──────────────────────────────────────────
('content_strategy_monthly', 'Content Strategy', 'Monthly Content Calendar', 'تقويم المحتوى الشهري',
 'Build a 30-day content calendar for real estate marketing',
 'أنشئ تقويم محتوى شهري (30 يوم) لوكالة عقارية: توزيع المحتوى على المنصات (إنستاقرام/فيسبوك/تيك توك/يوتيوب/مدونة)، الموضوعات اليومية، تنسيق المحتوى (فيديو/صورة/مقال/قصة)، الهاشتاقات، وجداول زمنية مقترحة، وخطة لإعادة توظيف المحتوى.'),

('content_ugc_strategy', 'Content Strategy', 'User Generated Content Strategy', 'استراتيجية محتوى المستخدمين',
 'Encourage clients to create content about their property purchase',
 'صمم استراتيجية UGC لوكالة عقارية: كيفية تحفيز العملاء على مشاركة قصص الشراء، قوالب جاهزة للعملاء، برنامج مكافآت لمن يشارك محتوى، كيفية إعادة نشر UGC بطريقة قانونية وأخلاقية، وقياس أثر UGC على المبيعات.'),

-- ── GROWTH HACKING ────────────────────────────────────────────
('growth_referral_program', 'Growth', 'Referral Program Design', 'تصميم برنامج الإحالة',
 'Design a real estate referral program for clients and agents',
 'صمم برنامج إحالة عقاري متكامل: هيكل المكافآت (نقدية/نقاط/هدايا) لكل إحالة ناجحة، آلية التتبع، شروط الاستحقاق، مواد التسويق للمشاركين، كيفية قياس ROI البرنامج، وتعديلات للوسطاء العقاريين.'),

('growth_partnership_strategy', 'Growth', 'Strategic Partnership Framework', 'إطار الشراكات الاستراتيجية',
 'Build partnership network for real estate growth',
 'طوّر إطار شراكات استراتيجي لنمو وكالة عقارية: شركاء محتملون (بنوك/شركات تأمين/مصممو داخلي/شركات نقل/محامون)، هيكل اتفاقية الشراكة، مزايا متبادلة، نظام تتبع الإحالات، وخطة تنشيط الشراكات.'),

('growth_viral_campaign', 'Growth', 'Viral Marketing Campaign', 'حملة تسويق فيروسي',
 'Design a viral real estate marketing campaign',
 'صمم حملة تسويق فيروسي لإطلاق مشروع عقاري جديد: الـ Hook المثير للمشاركة، ميكانيكية المنافسة أو التحدي، آلية الانتشار (Tag Friends/Share to Win)، المحتوى القابل للمشاركة، التوقيت والمنصات، وكيفية تحويل الانتشار إلى مبيعات.'),

-- ── PERSONAL BRAND ────────────────────────────────────────────
('personal_brand_agent', 'Personal Brand', 'Real Estate Agent Personal Brand', 'العلامة الشخصية للوسيط العقاري',
 'Build a personal brand strategy for real estate agents',
 'طوّر استراتيجية علامة شخصية لوسيط عقاري: تعريف نقطة التمايز الفريدة (لماذا أنا؟)، خبرة التخصص (منطقة/نوع عقار)، قصة شخصية مؤثرة، حضور رقمي متكامل (LinkedIn/Instagram/YouTube)، وكيفية الظهور كخبير موثوق في السوق.'),

('personal_brand_content_pillars', 'Personal Brand', 'Agent Content Pillars', 'محاور محتوى الوسيط',
 'Define 5 content pillars for a real estate agent personal brand',
 'حدّد 5 محاور محتوى لبناء علامة شخصية قوية لوسيط عقاري: 1) خبرة السوق (إحصائيات ورؤى)، 2) قصص نجاح العملاء (بإذنهم)، 3) خلف الكواليس (يوم في حياة وسيط)، 4) نصائح للمشترين والبائعين، 5) الحياة في المنطقة (مطاعم/مدارس/مرافق). مع أمثلة منشورات لكل محور.')

ON CONFLICT (skill_key) DO UPDATE SET
  department    = EXCLUDED.department,
  title_en      = EXCLUDED.title_en,
  title_ar      = EXCLUDED.title_ar,
  description_en = EXCLUDED.description_en,
  content       = EXCLUDED.content,
  updated_at    = now();
