// chat.js
let currentUser = null;
let currentChatPartnerId = null;

async function initChat() {
    console.log("Initializing chat...");
    const { data: { user } } = await db.auth.getUser();
    if (!user) {
        console.warn("No user logged in, redirecting to auth.html");
        // window.location.href = 'auth.html';
        return;
    }
    currentUser = user;
    console.log("Current user:", currentUser.email);

    // Deep link handling (from jobs.html)
    const urlParams = new URLSearchParams(window.location.search);
    const partnerId = urlParams.get('partner');
    const partnerName = urlParams.get('name');

    // Clear static HTML messages
    const messagesContainer = document.querySelector('.flex-1.overflow-y-auto.p-4.space-y-4');
    if (messagesContainer) messagesContainer.innerHTML = '<div class="text-center text-gray-500 py-10">Select a conversation to start chatting.</div>';

    // Load conversation list
    await loadConversations();

    // If deep linked, select that chat
    if (partnerId && partnerName) {
        selectChat(partnerId, partnerName);
    }

    // Set up real-time subscription
    db.channel('public:messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
            console.log("New message received:", payload.new);
            if (payload.new.receiver_id === currentUser.id || payload.new.sender_id === currentUser.id) {
                if (currentChatPartnerId && (payload.new.sender_id === currentChatPartnerId || payload.new.receiver_id === currentChatPartnerId)) {
                    appendMessage(payload.new);
                }
                loadConversations(); // Update sidebar
            }
        })
        .subscribe();
}

async function loadConversations() {
    console.log("Loading conversations...");
    const { data: messages, error } = await db
        .from('messages')
        .select(`
            *,
            sender_id,
            receiver_id
        `)
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error loading conversations:', error);
        return;
    }

    // Since we can't easily join on profiles for the sidebar in one go without complex select,
    // let's just get unique partner IDs first.
    const partnerIds = [...new Set(messages.map(m => m.sender_id === currentUser.id ? m.receiver_id : m.sender_id))];

    if (partnerIds.length === 0) {
        const sidebar = document.querySelector('.w-80 .flex-1.overflow-y-auto');
        if (sidebar) sidebar.innerHTML = '<div class="p-4 text-center text-gray-500">No messages yet.</div>';
        return;
    }

    // Fetch partner profiles
    const { data: partnerProfiles } = await db
        .from('profiles')
        .select('id, full_name, role')
        .in('id', partnerIds);

    const conversationsContainer = document.querySelector('.w-80 .flex-1.overflow-y-auto');
    if (!conversationsContainer) return;

    conversationsContainer.innerHTML = partnerProfiles.map(p => {
        const lastMsg = messages.find(m => m.sender_id === p.id || m.receiver_id === p.id);
        const time = new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return `
            <div onclick="selectChat('${p.id}', '${p.full_name}')" class="p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${currentChatPartnerId === p.id ? 'bg-blue-50' : ''}">
                <div class="flex gap-3">
                    <div class="relative">
                        <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-brand-blue font-bold">
                            ${(p.full_name || 'U').charAt(0).toUpperCase()}
                        </div>
                    </div>
                    <div class="flex-1 overflow-hidden">
                        <div class="flex justify-between items-center mb-1">
                            <h4 class="font-semibold text-sm truncate">${p.full_name || 'User'}</h4>
                            <span class="text-xs text-gray-400">${time}</span>
                        </div>
                        <p class="text-xs text-gray-500 truncate">${lastMsg.content}</p>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function selectChat(partnerId, partnerName) {
    console.log("Selecting chat with:", partnerName);
    currentChatPartnerId = partnerId;

    // Update Header
    const headerName = document.querySelector('h3.font-bold.text-sm');
    const headerAvatar = document.querySelector('.p-4.border-b.flex.items-center.gap-3 .w-10.h-10');

    if (headerName) headerName.innerText = partnerName;
    if (headerAvatar) headerAvatar.innerText = partnerName.charAt(0).toUpperCase();

    // Load messages
    const { data: messages, error } = await db
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${currentUser.id})`)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error loading messages:', error);
        return;
    }

    const messagesContainer = document.querySelector('.flex-1.overflow-y-auto.p-4.space-y-4');
    messagesContainer.innerHTML = '';
    messages.forEach(msg => appendMessage(msg, partnerName));
}

function appendMessage(msg, partnerName) {
    const messagesContainer = document.querySelector('.flex-1.overflow-y-auto.p-4.space-y-4');
    const isSent = msg.sender_id === currentUser.id;

    const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const msgHtml = isSent ? `
        <div class="flex gap-3 max-w-[80%] ml-auto justify-end">
            <div class="bg-brand-blue p-3 rounded-2xl rounded-tr-none shadow-sm text-white">
                <p class="text-sm">${msg.content}</p>
                <span class="text-[10px] text-blue-100 mt-1 block text-right">${time}</span>
            </div>
        </div>
    ` : `
        <div class="flex gap-3 max-w-[80%]">
            <div class="w-8 h-8 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center text-brand-blue font-bold text-xs mt-1">
                ${partnerName ? partnerName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div class="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-gray-100">
                <p class="text-sm text-gray-800">${msg.content}</p>
                <span class="text-[10px] text-gray-400 mt-1 block">${time}</span>
            </div>
        </div>
    `;

    messagesContainer.insertAdjacentHTML('beforeend', msgHtml);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function sendMessage() {
    const input = document.querySelector('input[placeholder="Type a message..."]');
    const content = input.value.trim();
    if (!content || !currentChatPartnerId) return;

    const { error } = await db.from('messages').insert({
        sender_id: currentUser.id,
        receiver_id: currentChatPartnerId,
        content: content
    });

    if (error) {
        alert('Error sending message: ' + error.message);
    } else {
        input.value = '';
    }
}

// Initializers
document.addEventListener('DOMContentLoaded', () => {
    initChat();

    // Send button listener
    const sendBtn = document.querySelector('button.bg-brand-blue.text-white.rounded-full');
    if (sendBtn) sendBtn.addEventListener('click', sendMessage);

    // Enter key listener
    const msgInput = document.querySelector('input[placeholder="Type a message..."]');
    if (msgInput) {
        msgInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }
});
