// Auth Modal Logic
const loginBtn = document.getElementById('loginBtn');
const authModal = document.getElementById('authModal');
const closeModal = document.querySelector('.close-modal');

loginBtn.addEventListener('click', () => {
    authModal.classList.add('active');
});

closeModal.addEventListener('click', () => {
    authModal.classList.remove('active');
});

// إغلاق النافذة يلا كليكا برا المربع
authModal.addEventListener('click', (e) => {
    if(e.target === authModal) {
        authModal.classList.remove('active');
    }
});

// التبديل بين تسجيل الدخول وإنشاء حساب
function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tabName + 'Form').classList.add('active');
}

// Chat UI Logic (تجريبي MVP)
const sendBtn = document.getElementById('sendBtn');
const userInput = document.getElementById('userInput');
const chatContainer = document.getElementById('chatContainer');
const welcomeScreen = document.querySelector('.welcome-screen');

function addMessage(text, sender) {
    // إخفاء رسالة الترحيب
    if(welcomeScreen) welcomeScreen.style.display = 'none';

    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', sender);

    const icon = sender === 'user' ? '<i class="fa-regular fa-user"></i>' : '<i class="fa-solid fa-brain"></i>';
    
    msgDiv.innerHTML = `
        <div class="avatar-chat">${icon}</div>
        <div class="message-content">
            <p>${text}</p>
        </div>
    `;
    
    chatContainer.appendChild(msgDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight; // Auto scroll to bottom
}

sendBtn.addEventListener('click', () => {
    const text = userInput.value.trim();
    if(!text) return;

    // إضافة رسالة المستخدم
    addMessage(text, 'user');
    userInput.value = '';

    // محاكاة رد الذكاء الاصطناعي (غادي تبدلها بـ API فالمستقبل)
    setTimeout(() => {
        addMessage("هذا رد تجريبي من Niveau AI. من بعد غادي نربطو هادشي بـ Gemini API وبقاعدة البيانات Supabase.", 'ai');
    }, 1000);
});

// الإرسال عن طريق زر Enter
userInput.addEventListener('keypress', (e) => {
    if(e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendBtn.click();
    }
});
// ==========================================
// 1. إعداد Supabase (حط الروابط ديال مشروعك هنا)
// ==========================================
const supabaseUrl = 'YOUR_SUPABASE_PROJECT_URL'; 
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
const supabase = supabase.createClient(supabaseUrl, supabaseAnonKey);

// ==========================================
// 2. إنشاء حساب جديد (Register)
// ==========================================
document.getElementById('submitRegister').addEventListener('click', async () => {
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value.trim();
    const firstName = document.getElementById('regFirstName').value.trim();
    const lastName = document.getElementById('regLastName').value.trim();

    if (!email || !password || !firstName) {
        alert("عافاك عمر الخانات كاملين!");
        return;
    }

    // تسجيل اليوزر مع حفظ السمية والكنية في User Metadata
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                first_name: firstName,
                last_name: lastName
            }
        }
    });

    if (error) {
        alert("خطأ في التسجيل: " + error.message);
    } else {
        alert("تم إنشاء الحساب بنجاح! راجع الإيميل ديالك باش تفعل الحساب.");
        switchTab('login'); // نرجعوه لصفحة الدخول
    }
});

// ==========================================
// 3. تسجيل الدخول العادي (Login with Email)
// ==========================================
document.getElementById('submitLogin').addEventListener('click', async () => {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    if (!email || !password) {
        alert("المرجو إدخال الإيميل وكلمة المرور.");
        return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        alert("كلمة المرور أو الإيميل غالطين: " + error.message);
    } else {
        authModal.classList.remove('active'); // سد النافذة
        checkUserStatus(); // تحديث الواجهة
    }
});

// ==========================================
// 4. الدخول باستخدام Google (OAuth)
// ==========================================
document.getElementById('googleLogin').addEventListener('click', async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
    });
    // Supabase غادي يدي اليوزر لصفحة جوجل ويرجعو للموقع أوتوماتيكياً
});

// ==========================================
// 5. التحقق من حالة المستخدم وتحديث الواجهة (Session Check)
// ==========================================
async function checkUserStatus() {
    // جلب بيانات اليوزر الحالي
    const { data: { user } } = await supabase.auth.getUser();
    const profileBtn = document.getElementById('loginBtn');
    
    if (user) {
        // إذا كان مسجل الدخول، غنبدلو الزر لسميتو ونعطيو إمكانية تسجيل الخروج
        const userName = user.user_metadata.first_name || user.email.split('@')[0];
        
        profileBtn.innerHTML = `
            <div class="avatar"><i class="fa-solid fa-user-check" style="color: #10a37f;"></i></div>
            <span>${userName} (خروج)</span>
        `;
        
        // تغيير وظيفة الزر لتسجيل الخروج
        profileBtn.onclick = async () => {
            if(confirm("واش بغيتي تخرج من الحساب؟")) {
                await supabase.auth.signOut();
                window.location.reload(); // إعادة تحميل الصفحة باش يرجع زائر عادي
            }
        };
    } else {
        // إذا كان زائر
        profileBtn.innerHTML = `
            <div class="avatar"><i class="fa-regular fa-user"></i></div>
            <span>Login / Register</span>
        `;
        // فتح نافذة التسجيل
        profileBtn.onclick = () => authModal.classList.add('active');
    }
}

// تشغيل الفحص أول ما تفتح الصفحة
checkUserStatus();
let currentChatId = null; // غنخزنو فيها الآيدي ديال الشات الحالي

// ==========================================
// 1. إنشاء محادثة جديدة (New Chat)
// ==========================================
async function createNewChat() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        alert("خصك تسجل الدخول باش تبدا شات جديد!");
        authModal.classList.add('active');
        return;
    }

    // إنشاء سطر جديد في جدول chats
    const { data, error } = await supabase
        .from('chats')
        .insert([{ user_id: user.id, title: 'محادثة جديدة' }])
        .select()
        .single();

    if (error) {
        console.error("خطأ في إنشاء المحادثة:", error);
    } else {
        currentChatId = data.id; // حفظنا الآيدي ديال الشات
        chatContainer.innerHTML = ''; // خوينا الشاشة ديال الشات
        addMessage("مرحبا! شات جديد تفتح، كيفاش نقدر نعاونك؟", 'ai');
    }
}

// ربط زر New Chat بهاد الفانكشن
document.querySelector('.new-chat-btn').addEventListener('click', createNewChat);

// ==========================================
// 2. حفظ الرسائل في القاعدة (Save Message)
// ==========================================
async function saveMessageToDB(role, content) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !currentChatId) return;

    const { error } = await supabase
        .from('messages')
        .insert([
            {
                chat_id: currentChatId,
                user_id: user.id,
                role: role,
                content: content
            }
        ]);

    if (error) console.error("خطأ في حفظ الرسالة:", error);
}

// ==========================================
// 3. تعديل زر الإرسال (Send Button Logic)
// ==========================================
// غادي نبدلو الفانكشن ديال sendBtn اللي درنا قبل بهادي باش تولي تحفظ فـ Database

sendBtn.addEventListener('click', async () => {
    const text = userInput.value.trim();
    if(!text) return;

    // يلا ماكانش شات مفتوح، نكرييو واحد جديد أوتوماتيك
    if (!currentChatId) {
        await createNewChat();
    }

    // 1. عرض وحفظ رسالة المستخدم
    addMessage(text, 'user');
    userInput.value = '';
    await saveMessageToDB('user', text); // الحفظ في Supabase

    // 2. محاكاة رد الذكاء الاصطناعي (من بعد غنربطوه بـ Gemini API)
    // غنديرو loading صغير
    const loadingId = "loading-" + Date.now();
    addMessage("Niveau AI بصدد الكتابة...", 'ai', loadingId);

    setTimeout(async () => {
        // حيدنا رسالة الـ Loading
        document.getElementById(loadingId).remove();
        
        const aiResponse = "هذا رد تجريبي من Niveau AI. من بعد غادي نربطو هادشي بـ Gemini API.";
        
        // عرض وحفظ رسالة الذكاء الاصطناعي
        addMessage(aiResponse, 'ai');
        await saveMessageToDB('ai', aiResponse); // الحفظ في Supabase
    }, 1500);
});

// تعديل بسيط على addMessage باش تقبل ID اختياري
function addMessage(text, sender, id = "") {
    if(welcomeScreen) welcomeScreen.style.display = 'none';

    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', sender);
    if(id) msgDiv.id = id;

    const icon = sender === 'user' ? '<i class="fa-regular fa-user"></i>' : '<i class="fa-solid fa-brain"></i>';
    
    msgDiv.innerHTML = `
        <div class="avatar-chat">${icon}</div>
        <div class="message-content">
            <p>${text}</p>
        </div>
    `;
    
    chatContainer.appendChild(msgDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}