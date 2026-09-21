// ==========================================
// القسم الأول: تشغيل الواجهة (UI) - باش الأزرار يخدمو دائما
// ==========================================

const loginBtn = document.getElementById('loginBtn');
const authModal = document.getElementById('authModal');
const closeModal = document.getElementById('closeModal');
const upgradeBtn = document.getElementById('upgradeBtn');
const newChatBtn = document.getElementById('newChatBtn');
const chatContainer = document.getElementById('chatContainer');
const welcomeScreen = document.getElementById('welcomeScreen');
const sendBtn = document.getElementById('sendBtn');
const userInput = document.getElementById('userInput');

// 1. فتح وإغلاق النافذة (Login / Register)
loginBtn.addEventListener('click', () => authModal.classList.add('active'));
closeModal.addEventListener('click', () => authModal.classList.remove('active'));
authModal.addEventListener('click', (e) => {
    if(e.target === authModal) authModal.classList.remove('active');
});

// 2. زر الترقية (Upgrade to Pro)
upgradeBtn.addEventListener('click', () => {
    alert("🚀 قريباً: خطط الدفع (Stripe) باش اليوزر يخدم بـ Pro!");
});

// 3. التبديل بين تسجيل الدخول وإنشاء حساب
function switchTab(tabName, event) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tabName + 'Form').classList.add('active');
}

// 4. زر دردشة جديدة
newChatBtn.addEventListener('click', () => {
    chatContainer.innerHTML = '';
    chatContainer.appendChild(welcomeScreen);
    welcomeScreen.style.display = 'block';
    currentChatId = null; // إعادة تعيين الشات في قاعدة البيانات
});

// 5. إضافة رسالة للشاشة
function addMessage(text, sender, id = "") {
    welcomeScreen.style.display = 'none';
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', sender);
    if(id) msgDiv.id = id;

    const icon = sender === 'user' ? '<i class="fa-regular fa-user"></i>' : '<i class="fa-solid fa-brain"></i>';
    msgDiv.innerHTML = `<div class="avatar-chat">${icon}</div><div class="message-content"><p>${text}</p></div>`;
    
    chatContainer.appendChild(msgDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// ==========================================
// القسم الثاني: إعداد قاعدة البيانات (Supabase)
// ==========================================

// غير هاد الروابط ملي تكريي المشروع ديالك فـ Supabase
const supabaseUrl = 'https://qerdrkhjmcussgfkwflo.supabase.co'; // ضروري يكون مكتوب بحال هكا باش مايطيحش السكريبت
const supabaseKey = 'sb_publishable_a0u7Sm3eSqg0N8i_49B52w_g44TrK_D';
let supabase = null;

// حماية باش إذا كانوا الروابط غالطين الموقع ما يخسرش
try {
    if (supabaseUrl.includes('supabase.co')) {
        supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
        console.log("Supabase تم الربط بنجاح!");
    }
} catch (error) {
    console.warn("Supabase مازال ماتربطش، الواجهة غتخدم فتجربة فقط.");
}

let currentChatId = null; // متغير لحفظ ID المحادثة الحالية

// ==========================================
// القسم الثالث: إرسال الرسائل وحفظها في Database
// ==========================================

sendBtn.addEventListener('click', async () => {
    const text = userInput.value.trim();
    if(!text) return;

    // عرض الرسالة
    addMessage(text, 'user');
    userInput.value = '';
    
    // إنشاء شات جديد وحفظ الرسالة (إذا كان Supabase خدام)
    if (supabase) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                if (!currentChatId) {
                    const { data } = await supabase.from('chats').insert([{ user_id: user.id, title: 'محادثة جديدة' }]).select().single();
                    if(data) currentChatId = data.id;
                }
                if (currentChatId) {
                    await supabase.from('messages').insert([{ chat_id: currentChatId, user_id: user.id, role: 'user', content: text }]);
                }
            }
        } catch (e) { console.error(e); }
    }

    // محاكاة رد الذكاء الاصطناعي
    const loadingId = "loading-" + Date.now();
    addMessage("Niveau AI بصدد الكتابة...", 'ai', loadingId);

    setTimeout(async () => {
        document.getElementById(loadingId).remove();
        const aiResponse = "هذا رد تجريبي من Niveau AI. الواجهة ديالك دابا ناضية وخدامة 100%!";
        addMessage(aiResponse, 'ai');

        // حفظ رد الذكاء الاصطناعي في Database
        if (supabase && currentChatId) {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if(user) {
                    await supabase.from('messages').insert([{ chat_id: currentChatId, user_id: user.id, role: 'ai', content: aiResponse }]);
                }
            } catch (e) {}
        }
    }, 1500);
});

// الإرسال بزر Enter
userInput.addEventListener('keypress', (e) => {
    if(e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendBtn.click();
    }
});