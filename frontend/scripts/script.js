 const API_BASE_URL = 'https://resturant-management-system-oddu.onrender.com/api/v1';

        // State Management
        let currentUser = null;
        let authToken = localStorage.getItem('token') || null;
        let categoriesCache = [];
        let itemsCache = [];
        let ordersCache = [];
        let currentStatusFilter = 'all';
        let currentOrderInModal = null;
        let posCart = [];
        let selectedPosCategory = null;

        // Mobile Sidebar Toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.getElementById('sidebar');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('-translate-x-full'));
        }

        // ================= AUTHENTICATION & GATE CONTROL =================
        function checkAuthStatus() {
            const storedUser = localStorage.getItem('user');
            authToken = localStorage.getItem('token');

            if (authToken && storedUser) {
                try {
                    currentUser = JSON.parse(storedUser);
                    showAuthenticatedApp();
                } catch (e) {
                    showUnauthenticatedGate();
                }
            } else {
                showUnauthenticatedGate();
            }
        }

        function showUnauthenticatedGate() {
            document.getElementById('unauthenticatedView').classList.remove('hidden');
            document.getElementById('authenticatedApp').classList.add('hidden');
            currentUser = null;
            authToken = null;
        }

        function showAuthenticatedApp() {
            document.getElementById('unauthenticatedView').classList.add('hidden');
            document.getElementById('authenticatedApp').classList.remove('hidden');
            renderAuthHeader();
            
            // Pre-fill POS customer name
            if (currentUser && currentUser.fullName) {
                const posNameEl = document.getElementById('posCustomerName');
                if (posNameEl) posNameEl.value = currentUser.fullName;
            }

            // Load initial authorized data
            loadDashboardCounts();
        }

        function renderAuthHeader() {
            const container = document.getElementById('authUserInfo');
            if (currentUser) {
                const initials = (currentUser.fullName || "User").split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
                const roleColor = currentUser.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700';

                container.innerHTML = `
                    <div class="flex items-center space-x-2">
                        <div class="w-8 h-8 rounded-full bg-orange-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                            ${initials}
                        </div>
                        <div class="hidden sm:block text-left">
                            <p class="text-xs font-bold text-gray-800 leading-tight">${currentUser.fullName}</p>
                            <span class="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${roleColor}">${currentUser.role || 'customer'}</span>
                        </div>
                    </div>
                    <button onclick="logout()" class="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-gray-100 transition" title="Logout">
                        <i class="fa-solid fa-right-from-bracket text-base"></i>
                    </button>
                `;
            }
        }

        function toggleGateView(view) {
            if (view === 'login') {
                document.getElementById('gateLoginBox').classList.remove('hidden');
                document.getElementById('gateSignupBox').classList.add('hidden');
            } else {
                document.getElementById('gateLoginBox').classList.add('hidden');
                document.getElementById('gateSignupBox').classList.remove('hidden');
            }
        }

        function quickLogin(email, pass) {
            document.getElementById('loginEmail').value = email;
            document.getElementById('loginPassword').value = pass;
            document.getElementById('loginSubmitBtn').click();
        }

        async function handleLoginSubmit(e) {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;

            try {
                const res = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();

                if (res.ok && data.token) {
                    authToken = data.token;
                    currentUser = data.user;
                    localStorage.setItem('token', authToken);
                    localStorage.setItem('user', JSON.stringify(currentUser));
                    showAuthenticatedApp();
                    alert(`Welcome back, ${currentUser.fullName}! 🎉`);
                } else {
                    alert(data.message || 'Login failed. Please check your email and password.');
                }
            } catch (err) {
                console.error(err);
                alert('Connection error. Please make sure the backend server is running.');
            }
        }

        async function handleSignupSubmit(e) {
            e.preventDefault();
            const fullName = document.getElementById('signupName').value.trim();
            const email = document.getElementById('signupEmail').value.trim();
            const phone = document.getElementById('signupPhone').value.trim();
            const password = document.getElementById('signupPassword').value;

            try {
                const res = await fetch(`${API_BASE_URL}/auth/sign-up`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fullName, email, phone, password })
                });
                const data = await res.json();

                if (res.ok && data.token) {
                    authToken = data.token;
                    currentUser = data.data;
                    localStorage.setItem('token', authToken);
                    localStorage.setItem('user', JSON.stringify(currentUser));
                    showAuthenticatedApp();
                    alert(`Account created successfully! Welcome, ${fullName}! 🎉`);
                } else {
                    alert(data.message || 'Signup failed.');
                }
            } catch (err) {
                console.error(err);
                alert('Connection error. Please try again.');
            }
        }

        function logout() {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            authToken = null;
            currentUser = null;
            showUnauthenticatedGate();
        }

        function getAuthHeaders() {
            const headers = { 'Content-Type': 'application/json' };
            if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
            return headers;
        }

        function handleApiUnauthorized(res) {
            if (res.status === 401) {
                alert("Session expired or unauthorized. Please log in again.");
                logout();
                return true;
            }
            return false;
        }

        // ================= TAB NAVIGATION =================
        function switchTab(tab) {
            if (!authToken) {
                showUnauthenticatedGate();
                return;
            }

            const pages = {
                dashboard: document.getElementById('page-dashboard'),
                orders: document.getElementById('page-orders'),
                pos: document.getElementById('page-pos'),
                categories: document.getElementById('page-categories'),
                menu: document.getElementById('page-menu')
            };
            const navs = {
                dashboard: document.getElementById('nav-dashboard'),
                orders: document.getElementById('nav-orders'),
                pos: document.getElementById('nav-pos'),
                categories: document.getElementById('nav-categories'),
                menu: document.getElementById('nav-menu')
            };

            const defaultNav = "w-full flex items-center space-x-3 px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition";
            const activeNav = "w-full flex items-center space-x-3 px-6 py-3 text-sm font-medium text-orange-600 bg-orange-50 border-r-4 border-orange-600 transition";

            Object.keys(pages).forEach(key => {
                if (pages[key]) pages[key].classList.add('hidden');
                if (navs[key]) navs[key].className = (key === 'orders' 
                    ? 'w-full flex items-center justify-between px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition'
                    : defaultNav);
            });

            if (pages[tab]) {
                pages[tab].classList.remove('hidden');
                if (navs[tab]) {
                    navs[tab].className = (tab === 'orders' 
                        ? 'w-full flex items-center justify-between px-6 py-3 text-sm font-medium text-orange-600 bg-orange-50 border-r-4 border-orange-600 transition'
                        : activeNav);
                }
            }

            if (tab === 'dashboard') loadDashboardCounts();
            if (tab === 'orders') fetchOrders();
            if (tab === 'pos') {
                loadCategoriesForPos();
                fetchPosItems();
            }
            if (tab === 'categories') fetchCategories();
            if (tab === 'menu') {
                loadCategoryDropdown();
                fetchItems();
            }

            if (window.innerWidth < 768) sidebar.classList.add('-translate-x-full');
        }

        // ================= DASHBOARD =================
        async function loadDashboardCounts() {
            if (!authToken) return;
            try {
                const res = await fetch(`${API_BASE_URL}/dashboard/stats`, { headers: getAuthHeaders() });
                if (handleApiUnauthorized(res)) return;

                const data = await res.json();

                if (data.success && data.stats) {
                    document.getElementById('dashRevenue').innerText = `৳${parseFloat(data.stats.totalRevenue || 0).toFixed(2)}`;
                    document.getElementById('dashTotalOrders').innerText = data.stats.totalOrders || 0;
                    document.getElementById('dashPendingOrders').innerText = data.stats.pendingOrders || 0;
                    document.getElementById('dashItemCount').innerText = data.stats.totalItems || 0;

                    // Update sidebar pending badge
                    const badge = document.getElementById('pendingBadgeSidebar');
                    if (data.stats.pendingOrders > 0) {
                        badge.innerText = data.stats.pendingOrders;
                        badge.classList.remove('hidden');
                    } else {
                        badge.classList.add('hidden');
                    }

                    // Render Recent Orders in Dashboard
                    const tbody = document.getElementById('dashRecentOrdersBody');
                    if (data.recentOrders && data.recentOrders.length > 0) {
                        tbody.innerHTML = data.recentOrders.map(o => `
                            <tr class="hover:bg-gray-50/60 transition">
                                <td class="p-3.5 font-bold text-gray-800">#ORD-${o.order_id}</td>
                                <td class="p-3.5 font-semibold text-gray-700">${o.customer_name}</td>
                                <td class="p-3.5 font-bold text-orange-600">৳${parseFloat(o.total_amount).toFixed(2)}</td>
                                <td class="p-3.5">
                                    <span class="text-[11px] font-bold px-2 py-0.5 rounded-full ${o.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}">
                                        ${o.payment_status.toUpperCase()}
                                    </span>
                                </td>
                                <td class="p-3.5">${getStatusBadge(o.status)}</td>
                                <td class="p-3.5 text-right">
                                    <button onclick="viewOrderDetails(${o.order_id})" class="text-orange-600 hover:text-orange-800 text-xs font-bold">
                                        View Details
                                    </button>
                                </td>
                            </tr>
                        `).join('');
                    } else {
                        tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-gray-400">No orders recorded yet.</td></tr>`;
                    }
                }
            } catch (e) {
                console.error("Dashboard stats error:", e);
            }
        }

        // ================= ORDERS MANAGEMENT =================
        async function fetchOrders() {
            if (!authToken) return;
            try {
                let url = `${API_BASE_URL}/orders?limit=100`;
                if (currentStatusFilter && currentStatusFilter !== 'all') {
                    url += `&status=${currentStatusFilter}`;
                }

                const res = await fetch(url, { headers: getAuthHeaders() });
                if (handleApiUnauthorized(res)) return;

                const data = await res.json();
                ordersCache = Array.isArray(data) ? data : [];
                renderOrdersTable(ordersCache);
            } catch (err) {
                console.error("Error fetching orders:", err);
            }
        }

        function renderOrdersTable(orders) {
            const tbody = document.getElementById('ordersTableBody');
            if (orders.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-gray-400">No orders found matching the filter.</td></tr>`;
                return;
            }

            tbody.innerHTML = orders.map(o => `
                <tr class="hover:bg-gray-50/50 transition">
                    <td class="p-3.5">
                        <span class="font-bold text-gray-900">#ORD-${o.order_id}</span>
                        <div class="text-[11px] text-gray-400 mt-0.5">${new Date(o.created_at).toLocaleDateString()} ${new Date(o.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    </td>
                    <td class="p-3.5">
                        <div class="font-bold text-gray-800">${o.customer_name}</div>
                        <div class="text-xs text-gray-500">${o.customer_phone || ''}</div>
                        ${o.table_no ? `<span class="inline-block bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded font-semibold mt-0.5">${o.table_no}</span>` : ''}
                    </td>
                    <td class="p-3.5 max-w-xs">
                        <div class="text-xs text-gray-700 line-clamp-2">${o.items_summary || 'No item detail'}</div>
                        <div class="text-[11px] text-gray-400 mt-0.5">${o.total_items_count || 1} item(s)</div>
                    </td>
                    <td class="p-3.5 font-extrabold text-orange-600 text-sm">
                        ৳${parseFloat(o.total_amount).toFixed(2)}
                    </td>
                    <td class="p-3.5">
                        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${o.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}">
                            ${o.payment_status.toUpperCase()}
                        </span>
                        <div class="text-[10px] text-gray-400 uppercase mt-0.5 font-medium">${o.payment_method || 'CASH'}</div>
                    </td>
                    <td class="p-3.5">
                        <select onchange="updateOrderStatusQuick(${o.order_id}, this.value)" class="text-xs font-semibold rounded-lg px-2 py-1 border border-gray-200 focus:outline-none ${getStatusColorClass(o.status)}">
                            <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="confirmed" ${o.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                            <option value="preparing" ${o.status === 'preparing' ? 'selected' : ''}>Preparing</option>
                            <option value="ready" ${o.status === 'ready' ? 'selected' : ''}>Ready</option>
                            <option value="delivered" ${o.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                            <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </td>
                    <td class="p-3.5 text-right space-x-2">
                        <button onclick="viewOrderDetails(${o.order_id})" class="text-gray-400 hover:text-orange-600 p-1.5 rounded hover:bg-orange-50 transition" title="View Order Receipt">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                        <button onclick="deleteOrder(${o.order_id})" class="text-gray-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50 transition" title="Cancel/Delete Order">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }

        function getStatusBadge(status) {
            const badges = {
                pending: '<span class="bg-amber-100 text-amber-700 text-xs px-2.5 py-0.5 rounded-full font-bold">Pending</span>',
                confirmed: '<span class="bg-blue-100 text-blue-700 text-xs px-2.5 py-0.5 rounded-full font-bold">Confirmed</span>',
                preparing: '<span class="bg-purple-100 text-purple-700 text-xs px-2.5 py-0.5 rounded-full font-bold">Preparing</span>',
                ready: '<span class="bg-indigo-100 text-indigo-700 text-xs px-2.5 py-0.5 rounded-full font-bold">Ready</span>',
                delivered: '<span class="bg-emerald-100 text-emerald-700 text-xs px-2.5 py-0.5 rounded-full font-bold">Delivered</span>',
                cancelled: '<span class="bg-rose-100 text-rose-700 text-xs px-2.5 py-0.5 rounded-full font-bold">Cancelled</span>',
            };
            return badges[status] || `<span class="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded">${status}</span>`;
        }

        function getStatusColorClass(status) {
            const colors = {
                pending: 'bg-amber-50 text-amber-700',
                confirmed: 'bg-blue-50 text-blue-700',
                preparing: 'bg-purple-50 text-purple-700',
                ready: 'bg-indigo-50 text-indigo-700',
                delivered: 'bg-emerald-50 text-emerald-700',
                cancelled: 'bg-rose-50 text-rose-700'
            };
            return colors[status] || 'bg-gray-50 text-gray-700';
        }

        function filterOrders(status) {
            currentStatusFilter = status;
            const buttons = document.querySelectorAll('#orderStatusTabs .status-tab-btn');
            buttons.forEach(btn => {
                if (btn.innerText.toLowerCase() === status) {
                    btn.className = "status-tab-btn active bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap";
                } else {
                    btn.className = "status-tab-btn text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap";
                }
            });
            fetchOrders();
        }

        function searchOrders(keyword) {
            const term = keyword.toLowerCase().trim();
            if (!term) {
                renderOrdersTable(ordersCache);
                return;
            }
            const filtered = ordersCache.filter(o => 
                o.order_id.toString().includes(term) ||
                (o.customer_name && o.customer_name.toLowerCase().includes(term)) ||
                (o.customer_phone && o.customer_phone.toLowerCase().includes(term)) ||
                (o.table_no && o.table_no.toLowerCase().includes(term))
            );
            renderOrdersTable(filtered);
        }

        async function updateOrderStatusQuick(orderId, newStatus) {
            try {
                const res = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ status: newStatus })
                });
                if (res.ok) {
                    loadDashboardCounts();
                    fetchOrders();
                } else {
                    alert("Failed to update status.");
                }
            } catch (err) {
                console.error(err);
            }
        }

        async function deleteOrder(orderId) {
            if (!confirm(`Are you sure you want to delete order #ORD-${orderId}?`)) return;
            try {
                const res = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
                    method: 'DELETE',
                    headers: getAuthHeaders()
                });
                if (res.ok) {
                    fetchOrders();
                    loadDashboardCounts();
                }
            } catch (err) {
                console.error(err);
            }
        }

        // ================= ORDER DETAILS MODAL (RECEIPT) =================
        async function viewOrderDetails(orderId) {
            try {
                const res = await fetch(`${API_BASE_URL}/orders/${orderId}`, { headers: getAuthHeaders() });
                if (handleApiUnauthorized(res)) return;

                const order = await res.json();
                if (!order || !order.order_id) {
                    alert("Order details not found.");
                    return;
                }

                currentOrderInModal = order;
                document.getElementById('modOrderId').innerText = `Order #ORD-${order.order_id}`;
                document.getElementById('modOrderDate').innerText = `Placed: ${new Date(order.created_at).toLocaleString()}`;
                document.getElementById('modCustomerName').innerText = order.customer_name;
                document.getElementById('modCustomerPhone').innerText = `Phone: ${order.customer_phone || 'N/A'}`;
                document.getElementById('modCustomerEmail').innerText = `Email: ${order.customer_email || 'N/A'}`;
                document.getElementById('modTableAddress').innerText = `Table/Location: ${order.table_no || order.delivery_address || 'Dine-in'}`;
                document.getElementById('modPaymentInfo').innerText = `Payment: ${order.payment_method ? order.payment_method.toUpperCase() : 'CASH'} (${order.payment_status ? order.payment_status.toUpperCase() : 'PENDING'})`;
                document.getElementById('modOrderNotes').innerText = order.notes ? `Special Notes: "${order.notes}"` : '';

                const tbody = document.getElementById('modOrderItemsBody');
                if (order.items && order.items.length > 0) {
                    tbody.innerHTML = order.items.map(item => `
                        <tr class="border-b border-gray-50">
                            <td class="p-3">
                                <span class="font-bold text-gray-800">${item.item_name}</span>
                                ${item.category_name ? `<div class="text-[10px] text-gray-400">${item.category_name}</div>` : ''}
                            </td>
                            <td class="p-3 text-center font-medium">৳${parseFloat(item.unit_price).toFixed(2)}</td>
                            <td class="p-3 text-center font-bold">x${item.quantity}</td>
                            <td class="p-3 text-right font-bold text-gray-900">৳${parseFloat(item.subtotal).toFixed(2)}</td>
                        </tr>
                    `).join('');
                } else {
                    tbody.innerHTML = `<tr><td colspan="4" class="p-3 text-center text-gray-400">No item breakdown found.</td></tr>`;
                }

                document.getElementById('modSubtotal').innerText = `৳${parseFloat(order.total_amount).toFixed(2)}`;
                document.getElementById('modGrandTotal').innerText = `৳${parseFloat(order.total_amount).toFixed(2)}`;
                document.getElementById('modStatusSelect').value = order.status;

                document.getElementById('orderDetailsModal').classList.remove('hidden');
            } catch (err) {
                console.error("Error loading order details:", err);
            }
        }

        function closeOrderModal() {
            document.getElementById('orderDetailsModal').classList.add('hidden');
            currentOrderInModal = null;
        }

        async function saveOrderStatusFromModal() {
            if (!currentOrderInModal) return;
            const newStatus = document.getElementById('modStatusSelect').value;
            try {
                const res = await fetch(`${API_BASE_URL}/orders/${currentOrderInModal.order_id}/status`, {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ status: newStatus })
                });
                if (res.ok) {
                    alert(`Order status updated to ${newStatus.toUpperCase()}!`);
                    closeOrderModal();
                    fetchOrders();
                    loadDashboardCounts();
                }
            } catch (err) {
                console.error(err);
            }
        }

        function printOrderReceipt() {
            window.print();
        }

        // ================= PLACE ORDER (POS) =================
        async function loadCategoriesForPos() {
            try {
                const res = await fetch(`${API_BASE_URL}/categories?limit=50`, { headers: getAuthHeaders() });
                categoriesCache = await res.json();
                const container = document.getElementById('posCategoryTabs');
                
                container.innerHTML = `
                    <button onclick="filterPosMenu(null)" class="pos-cat-btn ${selectedPosCategory === null ? 'active bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap">All</button>
                ` + (Array.isArray(categoriesCache) ? categoriesCache.map(cat => `
                    <button onclick="filterPosMenu(${cat.category_id})" class="pos-cat-btn ${selectedPosCategory === cat.category_id ? 'active bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap">${cat.category_name}</button>
                `).join('') : '');
            } catch (e) {
                console.error(e);
            }
        }

        async function fetchPosItems() {
            try {
                let url = `${API_BASE_URL}/items?limit=100`;
                if (selectedPosCategory) url += `&categoryId=${selectedPosCategory}`;
                const res = await fetch(url, { headers: getAuthHeaders() });
                itemsCache = await res.json();
                renderPosItems(itemsCache);
            } catch (err) {
                console.error(err);
            }
        }

        function renderPosItems(items) {
            const grid = document.getElementById('posItemsGrid');
            if (!Array.isArray(items) || items.length === 0) {
                grid.innerHTML = `<div class="col-span-full text-center py-10 text-gray-400 text-sm">No food items found in this category.</div>`;
                return;
            }

            grid.innerHTML = items.map(item => `
                <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between hover:border-orange-200 transition group">
                    <div>
                        <div class="h-32 bg-gray-100 relative overflow-hidden">
                            <img src="${item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600'}" alt="${item.item_name}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
                            <span class="absolute top-2 left-2 bg-white/95 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                                ${item.category_name || 'Dish'}
                            </span>
                        </div>
                        <div class="p-3">
                            <h3 class="font-bold text-gray-800 text-sm">${item.item_name}</h3>
                            <p class="text-xs text-gray-500 line-clamp-1 mt-0.5">${item.descriptions || ''}</p>
                        </div>
                    </div>
                    <div class="p-3 pt-0 flex items-center justify-between border-t border-gray-50 mt-2">
                        <span class="font-extrabold text-orange-600 text-sm">৳${parseFloat(item.price || 0).toFixed(2)}</span>
                        <button onclick="addToPosCart(${item.food_item_id}, '${encodeURIComponent(item.item_name)}', ${item.price || 0})" class="bg-orange-600 hover:bg-orange-700 text-white px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1">
                            <i class="fa-solid fa-plus text-[10px]"></i> Add
                        </button>
                    </div>
                </div>
            `).join('');
        }

        function filterPosMenu(catId) {
            selectedPosCategory = catId;
            loadCategoriesForPos();
            fetchPosItems();
        }

        function searchPosMenu(query) {
            const term = query.toLowerCase().trim();
            if (!term) {
                renderPosItems(itemsCache);
                return;
            }
            const filtered = itemsCache.filter(i => 
                i.item_name.toLowerCase().includes(term) || 
                (i.descriptions && i.descriptions.toLowerCase().includes(term))
            );
            renderPosItems(filtered);
        }

        function addToPosCart(id, encodedName, price) {
            const name = decodeURIComponent(encodedName);
            const existing = posCart.find(i => i.id === id);
            if (existing) {
                existing.qty += 1;
            } else {
                posCart.push({ id, name, price: parseFloat(price), qty: 1 });
            }
            renderPosCart();
        }

        function updateCartQty(id, delta) {
            const item = posCart.find(i => i.id === id);
            if (!item) return;
            item.qty += delta;
            if (item.qty <= 0) {
                posCart = posCart.filter(i => i.id !== id);
            }
            renderPosCart();
        }

        function removeCartItem(id) {
            posCart = posCart.filter(i => i.id !== id);
            renderPosCart();
        }

        function clearPosCart() {
            posCart = [];
            renderPosCart();
        }

        function renderPosCart() {
            const container = document.getElementById('posCartItems');
            if (posCart.length === 0) {
                container.innerHTML = `<div class="text-center py-8 text-gray-400 text-xs">Your cart is empty. Click items to add.</div>`;
                document.getElementById('posSubtotal').innerText = "৳0.00";
                document.getElementById('posTotal').innerText = "৳0.00";
                return;
            }

            let grandTotal = 0;
            container.innerHTML = posCart.map(item => {
                const subtotal = item.price * item.qty;
                grandTotal += subtotal;
                return `
                    <div class="flex items-center justify-between text-xs border-b border-gray-100 pb-2">
                        <div class="flex-1 pr-2">
                            <p class="font-bold text-gray-800">${item.name}</p>
                            <p class="text-gray-500 text-[11px]">৳${item.price.toFixed(2)} x ${item.qty} = <span class="font-semibold text-gray-800">৳${subtotal.toFixed(2)}</span></p>
                        </div>
                        <div class="flex items-center space-x-1.5">
                            <button onclick="updateCartQty(${item.id}, -1)" class="w-5 h-5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded flex items-center justify-center font-bold text-xs">-</button>
                            <span class="font-bold w-4 text-center text-xs">${item.qty}</span>
                            <button onclick="updateCartQty(${item.id}, 1)" class="w-5 h-5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded flex items-center justify-center font-bold text-xs">+</button>
                            <button onclick="removeCartItem(${item.id})" class="text-red-400 hover:text-red-600 pl-1"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                    </div>
                `;
            }).join('');

            document.getElementById('posSubtotal').innerText = `৳${grandTotal.toFixed(2)}`;
            document.getElementById('posTotal').innerText = `৳${grandTotal.toFixed(2)}`;
        }

        async function submitPosOrder() {
            if (posCart.length === 0) {
                alert("Please add at least one item to the cart.");
                return;
            }

            const customerName = document.getElementById('posCustomerName').value.trim();
            if (!customerName) {
                alert("Please provide a customer name.");
                return;
            }

            const customerPhone = document.getElementById('posCustomerPhone').value.trim();
            const tableNo = document.getElementById('posTableNo').value.trim();
            const deliveryAddress = document.getElementById('posAddress').value.trim();
            const paymentMethod = document.getElementById('posPaymentMethod').value;
            const notes = document.getElementById('posNotes').value.trim();

            const orderPayload = {
                customerName,
                customerPhone: customerPhone || "N/A",
                customerEmail: currentUser ? currentUser.email : null,
                tableNo: tableNo || null,
                deliveryAddress: deliveryAddress || null,
                paymentMethod,
                notes: notes || null,
                items: posCart.map(i => ({
                    foodItemId: i.id,
                    quantity: i.qty,
                    unitPrice: i.price
                }))
            };

            try {
                const res = await fetch(`${API_BASE_URL}/orders`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(orderPayload)
                });
                if (handleApiUnauthorized(res)) return;

                const data = await res.json();

                if (res.ok && data.success && data.order) {
                    alert(`Order #ORD-${data.order.orderId} placed successfully! 🎉`);
                    clearPosCart();
                    loadDashboardCounts();
                    // Open the order details receipt right away
                    viewOrderDetails(data.order.orderId);
                } else {
                    alert(data.message || "Failed to place order.");
                }
            } catch (err) {
                console.error("Order submission error:", err);
                alert("Connection error while creating order.");
            }
        }

        // ================= CATEGORIES CRUD =================
        async function fetchCategories() {
            if (!authToken) return;
            try {
                const res = await fetch(`${API_BASE_URL}/categories?limit=100`, { headers: getAuthHeaders() });
                if (handleApiUnauthorized(res)) return;

                const data = await res.json();
                categoriesCache = Array.isArray(data) ? data : [];
                const tbody = document.getElementById('categoryTableBody');
                
                if (categoriesCache.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-gray-400">No categories found.</td></tr>`;
                    return;
                }

                tbody.innerHTML = categoriesCache.map(cat => `
                    <tr class="hover:bg-gray-50/50 transition">
                        <td class="p-4 font-semibold text-gray-500">#${cat.category_id}</td>
                        <td class="p-4 font-bold text-gray-900">${cat.category_name}</td>
                        <td class="p-4 text-gray-500">${cat.category_slug}</td>
                        <td class="p-4 text-gray-500">${cat.category_description || '-'}</td>
                        <td class="p-4 text-right space-x-2">
                            <button onclick="editCategory(${cat.category_id}, '${encodeURIComponent(cat.category_name)}', '${encodeURIComponent(cat.category_slug)}', '${encodeURIComponent(cat.category_description || '')}')" class="text-gray-400 hover:text-blue-600"><i class="fa-solid fa-pencil"></i></button>
                            <button onclick="deleteCategory(${cat.category_id})" class="text-gray-400 hover:text-red-600"><i class="fa-solid fa-trash"></i></button>
                        </td>
                    </tr>
                `).join('');
            } catch (err) {
                console.error("Error fetching categories:", err);
            }
        }

        async function loadCategoryDropdown() {
            if (!authToken) return;
            try {
                if (categoriesCache.length === 0) {
                    const res = await fetch(`${API_BASE_URL}/categories?limit=100`, { headers: getAuthHeaders() });
                    if (handleApiUnauthorized(res)) return;
                    categoriesCache = await res.json();
                }
                const select = document.getElementById('itemCategorySelect');
                if (select) {
                    select.innerHTML = '<option value="">Select a category</option>' + 
                        (Array.isArray(categoriesCache) ? categoriesCache.map(cat => `<option value="${cat.category_id}">${cat.category_name}</option>`).join('') : '');
                }
            } catch (err) {
                console.error("Error loading categories dropdown:", err);
            }
        }

        function openCategoryModal() {
            document.getElementById('categoryModalTitle').innerText = "Add Category";
            document.getElementById('catIdInput').value = "";
            document.getElementById('catNameInput').value = "";
            document.getElementById('catSlugInput').value = "";
            document.getElementById('catDescInput').value = "";
            document.getElementById('categoryModal').classList.remove('hidden');
        }

        function closeCategoryModal() {
            document.getElementById('categoryModal').classList.add('hidden');
        }

        function editCategory(id, name, slug, desc) {
            document.getElementById('categoryModalTitle').innerText = "Edit Category";
            document.getElementById('catIdInput').value = id;
            document.getElementById('catNameInput').value = decodeURIComponent(name);
            document.getElementById('catSlugInput').value = decodeURIComponent(slug);
            document.getElementById('catDescInput').value = decodeURIComponent(desc);
            document.getElementById('categoryModal').classList.remove('hidden');
        }

        async function handleCategorySubmit(e) {
            e.preventDefault();
            const id = document.getElementById('catIdInput').value;
            const payload = {
                categoryName: document.getElementById('catNameInput').value,
                categorySlug: document.getElementById('catSlugInput').value,
                categoryDescription: document.getElementById('catDescInput').value
            };

            const url = id ? `${API_BASE_URL}/categories/${id}` : `${API_BASE_URL}/categories`;
            const method = id ? 'PUT' : 'POST';

            try {
                const res = await fetch(url, {
                    method: method,
                    headers: getAuthHeaders(),
                    body: JSON.stringify(payload)
                });
                if (handleApiUnauthorized(res)) return;

                if (res.ok) {
                    closeCategoryModal();
                    fetchCategories();
                    loadCategoryDropdown();
                    loadDashboardCounts();
                }
            } catch (err) {
                console.error(err);
            }
        }

        async function deleteCategory(id) {
            if (!confirm("Are you sure you want to delete this category?")) return;
            try {
                const res = await fetch(`${API_BASE_URL}/categories/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
                if (handleApiUnauthorized(res)) return;

                if (res.ok) {
                    fetchCategories();
                    loadCategoryDropdown();
                    loadDashboardCounts();
                }
            } catch (err) {
                console.error(err);
            }
        }

        // ================= FOOD ITEMS CRUD =================
        async function fetchItems() {
            if (!authToken) return;
            try {
                const res = await fetch(`${API_BASE_URL}/items?limit=50`, { headers: getAuthHeaders() });
                if (handleApiUnauthorized(res)) return;

                const data = await res.json();
                const container = document.getElementById('itemsContainer');

                if (!Array.isArray(data) || data.length === 0) {
                    container.innerHTML = `<div class="col-span-full text-center text-gray-400 py-10">No food items found.</div>`;
                    return;
                }

                container.innerHTML = data.map(item => `
                    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col justify-between">
                        <div>
                            <div class="relative h-48 bg-gray-200">
                                <img src="${item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600'}" alt="${item.item_name}" class="w-full h-full object-cover">
                                <span class="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-orange-600 text-xs font-bold px-2.5 py-1 rounded-md shadow-sm">
                                    ${item.category_name || 'Uncategorized'}
                                </span>
                                <span class="absolute bottom-3 right-3 bg-black/75 text-white text-xs font-extrabold px-2.5 py-1 rounded-md backdrop-blur-sm">
                                    ৳${parseFloat(item.price || 0).toFixed(2)}
                                </span>
                            </div>
                            <div class="p-4">
                                <h3 class="font-bold text-gray-800 text-base">${item.item_name}</h3>
                                <p class="text-xs text-gray-500 mt-1 line-clamp-2">${item.descriptions || ''}</p>
                            </div>
                        </div>
                        <div class="p-4 border-t border-gray-100 flex items-center justify-between">
                            <span class="text-xs text-emerald-600 font-semibold"><i class="fa-solid fa-circle-check"></i> Available</span>
                            <div class="flex items-center gap-2">
                                <button onclick="editItem(${item.food_item_id}, ${item.category_id}, '${encodeURIComponent(item.item_name)}', ${item.price || 0}, '${encodeURIComponent(item.descriptions || '')}', '${encodeURIComponent(item.image_url || '')}')" class="text-gray-400 hover:text-blue-600 p-1"><i class="fa-solid fa-pencil"></i></button>
                                <button onclick="deleteItem(${item.food_item_id})" class="text-gray-400 hover:text-red-600 p-1"><i class="fa-solid fa-trash"></i></button>
                            </div>
                        </div>
                    </div>
                `).join('');
            } catch (err) {
                console.error("Error fetching items:", err);
            }
        }

        async function openItemModal() {
            await loadCategoryDropdown();
            document.getElementById('itemModalTitle').innerText = "Add Menu Item";
            document.getElementById('itemIdInput').value = "";
            document.getElementById('itemCategorySelect').value = "";
            document.getElementById('itemNameInput').value = "";
            document.getElementById('itemPriceInput').value = "";
            document.getElementById('itemImageInput').value = "";
            document.getElementById('itemDescInput').value = "";
            document.getElementById('itemModal').classList.remove('hidden');
        }

        function closeItemModal() {
            document.getElementById('itemModal').classList.add('hidden');
        }

        async function editItem(id, catId, name, price, desc, img) {
            await loadCategoryDropdown();
            document.getElementById('itemModalTitle').innerText = "Edit Menu Item";
            document.getElementById('itemIdInput').value = id;
            document.getElementById('itemCategorySelect').value = catId || "";
            document.getElementById('itemNameInput').value = decodeURIComponent(name);
            document.getElementById('itemPriceInput').value = price || 0;
            document.getElementById('itemDescInput').value = decodeURIComponent(desc);
            document.getElementById('itemImageInput').value = decodeURIComponent(img);
            document.getElementById('itemModal').classList.remove('hidden');
        }

        async function handleItemSubmit(e) {
            e.preventDefault();
            const id = document.getElementById('itemIdInput').value;
            const payload = {
                categoryId: parseInt(document.getElementById('itemCategorySelect').value),
                itemName: document.getElementById('itemNameInput').value,
                price: parseFloat(document.getElementById('itemPriceInput').value) || 0,
                descriptions: document.getElementById('itemDescInput').value,
                imageUrl: document.getElementById('itemImageInput').value
            };

            const url = id ? `${API_BASE_URL}/items/${id}` : `${API_BASE_URL}/items`;
            const method = id ? 'PUT' : 'POST';

            try {
                const res = await fetch(url, {
                    method: method,
                    headers: getAuthHeaders(),
                    body: JSON.stringify(payload)
                });
                if (handleApiUnauthorized(res)) return;

                if (res.ok) {
                    closeItemModal();
                    fetchItems();
                    loadDashboardCounts();
                }
            } catch (err) {
                console.error(err);
            }
        }

        async function deleteItem(id) {
            if (!confirm("Are you sure you want to delete this food item?")) return;
            try {
                const res = await fetch(`${API_BASE_URL}/items/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
                if (handleApiUnauthorized(res)) return;

                if (res.ok) {
                    fetchItems();
                    loadDashboardCounts();
                }
            } catch (err) {
                console.error(err);
            }
        }

        // ================= GLOBAL SEARCH =================
        function handleGlobalSearch(e) {
            const query = e.target.value.trim().toLowerCase();
            if (e.key === 'Enter') {
                if (query.startsWith('#') || !isNaN(query)) {
                    switchTab('orders');
                    searchOrders(query.replace('#', '').replace('ord-', ''));
                } else {
                    switchTab('menu');
                }
            }
        }

        // Initialize on load
        window.addEventListener('DOMContentLoaded', () => {
            checkAuthStatus();
        });