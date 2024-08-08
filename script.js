document.addEventListener('DOMContentLoaded', () => {
    const productGrid = document.getElementById('product-grid');
    const cartPane = document.getElementById('cart-pane');
    const cartItemsContainer = document.getElementById('cart-items');
    const checkoutForm = document.getElementById('checkout-form');
    const closeCartButton = document.getElementById('close-cart');
    const clearCartButton = document.getElementById('clear-cart');
    const viewCartButton = document.getElementById('view-cart');
    const cartCount = document.getElementById('cart-count');
    const categoryFilter = document.getElementById('category-filter');
    let products = [];
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    let zones = [];
    let delivaryFee = Infinity;

    // Customization Options
    const currency = "dh";
    const spaceBetweenPriceAndCurrency = true;
    const currencyFirst = true;
    const numOfDecimals = 2;
    const maxExtrasBeforeScroll = 3;
    const extraPrefix = "اضافة ";
    const RTLLayout = true;
    const invalidPriceTag = '-';
    const hideCurrencyWhenInvalidChoice = true;
    const phoneNumber = "+971556260381";
    const emptyCartError = "برجاء اضافة طلبات للسلة قبل ارسال الطلب";
    const invalidOrderError = 'طلب غير صالح';
    const invalidExtraError = 'اضافة غير صالحة';
    const invalidDestinationError = 'منطقة توصيل غير صالحة';


    //you can edit the message via editing the text and the following variables:
    //seperator: the seperator between orders
    function messageContent(name, address, notes) {
        const directionMark = RTLLayout ? `\u200F` : `\u200E`;
        const seperator = `\n\n${directionMark}--------------------------------\n\n`;
        let message =
            `${directionMark}مرحبا, اود تقديم طلب.\n\n`

            + `${directionMark}اريد تسليمه الى: ${address}\n\n`

            + `${directionMark}الاسم: ${name}\n\n`

            + `${directionMark}ملاحظات: ${notes}`;

        //for cart items use:
        //item.name, item.variant, item.price, item.extraPrice, item.quantity, item.selectedExtras

        message += seperator;
        let totalPrice = 0;
        cart.forEach((item) => {
            let extras = '';
            const variant = (item.variant ? ` ${item.variant}` : ``);

            if (item.selectedExtras.length > 0) {
                //you can edit the "join" to change the seperator between extras
                extras = `\n${directionMark}${item.selectedExtras.map(extra => `${extraPrefix}${extra}`).join(', ')}\t${displayPrice(item.extraPrice)}`;
            }


            message += `${directionMark}${item.quantity} x ${item.name}${variant}\t${displayPrice(item.price)}${extras}\n`;

            const productTotal = (item.price + item.extraPrice) * item.quantity;

            message += `${directionMark}إجمالي المنتج: \t${displayPrice(productTotal)}`;
            message += seperator;

            totalPrice += productTotal;
        });

        message += `${directionMark}سعر الطلب: ${displayPrice(totalPrice)}`;
        message += '\n';
        message += `${directionMark}سعر التوصيل: ${displayPrice(delivaryFee)}`;
        message += '\n';
        message += `${directionMark}السعر النهائي: ${displayPrice(totalPrice+delivaryFee)}`;

        return message;
    }

    function directionChanges() {
        document.body.style.direction = RTLLayout ? 'rtl' : 'ltr';

        // if(RTLLayout) {
        //     cartPane.style.setProperty("left", "0");
        //     document.documentElement.style.setProperty("--animation-direction", "-100%");
        // }
        // else {
        //     cartPane.style.setProperty("right", "0");
        // }
    }

    directionChanges();


    function displayPrice(price) {
        if (!isFinite(price) && hideCurrencyWhenInvalidChoice)
            return invalidPriceTag;

        first = (isFinite(price)) ? price.toFixed(numOfDecimals).toString() : invalidPriceTag;
        second = currency;
        if (currencyFirst)
            [first, second] = [second, first];
        if (spaceBetweenPriceAndCurrency)
            second = ` ${second}`;
        return first + second;
    }

    function setWithIdx(idx, arr) {
        return (idx >= arr.length || isNaN(parseFloat(arr[idx]))) ? Infinity : parseFloat(arr[idx]);
    }

    function renderProducts(products) {
        productGrid.innerHTML = '';
        products.forEach(product => {
            const productItem = document.createElement('div');
            productItem.className = 'product-item';
            productItem.dataset.id = product.id;
            product.price = setWithIdx(0, product.prices);
            productItem.innerHTML = `
              <img src="${product.image}" alt="${product.name}">
              <h3>${product.name}</h3>
              <p>${product.description}</p>
              <p class="product-price">${displayPrice(product.price)}</p> 
              ${product.variants.length > 0 ? `
                <select id="variant-${product.id}">
                  ${product.variants.map(variant => `<option value="${variant}">${variant}</option>`).join('')}
                </select>
              ` : ''}
            `;
            productGrid.appendChild(productItem);

            // Add event listener to select element
            const variantSelect = productItem.querySelector(`#variant-${product.id}`);
            if(variantSelect) {
                variantSelect.addEventListener('change', () => {
                    const selectedIndex = product.variants.indexOf(variantSelect.value);
                    product.price = setWithIdx(selectedIndex, product.prices);
                    productItem.querySelector('.product-price').textContent = `${displayPrice(product.price + product.extraPrice)}`;
                });
            }

            // Check if there are extras and create the "extras" div if necessary
            if (product.extras.length > 0) {
                const extrasDiv = document.createElement('div');
                extrasDiv.className = 'extras';
                extrasDiv.innerHTML = `
                    <h3>إضافات</h3>
                    <div id="extras-${product.id}" class="extras-container"></div>
                `;
                productItem.appendChild(extrasDiv);

                // Add extra checkboxes
                const extrasCheckboxesContainer = extrasDiv.querySelector(`#extras-${product.id}`);
                if (product.extras.length > maxExtrasBeforeScroll) {
                    extrasCheckboxesContainer.classList.add('extras-container-long');
                }

                product.extras.forEach((extra, index) => {
                    const extraPrice = setWithIdx(index, product.extraPrices);

                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.id = `extra-${product.id}-${index}`;
                    checkbox.value = extraPrice;
                    checkbox.dataset.extraId = index;

                    const label = document.createElement('label');
                    label.htmlFor = `extra-${product.id}-${index}`;
                    label.textContent = `${extra} (${displayPrice(extraPrice)})`;

                    extrasCheckboxesContainer.appendChild(checkbox);
                    extrasCheckboxesContainer.appendChild(label);

                    checkbox.addEventListener('change', () => {
                        if (checkbox.checked) {
                            if (isFinite(extraPrice)) {
                                product.extraPrice += extraPrice;
                                product.selectedExtras.push(extra);
                            } else {
                                product.invalidCtr++;
                            }
                        } else {
                            if (isFinite(extraPrice)) {
                                product.extraPrice -= extraPrice;
                                product.selectedExtras.splice(product.selectedExtras.indexOf(extra), 1);
                            } else {
                                product.invalidCtr--;
                            }
                        }
                        const price = product.invalidCtr > 0 ? Infinity : product.price + product.extraPrice;
                        productItem.querySelector('.product-price').textContent = `${displayPrice(price)}`;
                    });
                });
            }

            // Add the "Add to Cart" button at the end
            const addToCartButton = document.createElement('button');
            addToCartButton.textContent = 'أضف إلى السلة';
            addToCartButton.onclick = () => addToCart(product.id);
            productItem.appendChild(addToCartButton);
        });
    }

    window.addToCart = function(productId) {
        const product = products.find(p => p.id === productId);
        if (product.invalidCtr > 0 || !isFinite(product.price)) {
            alert(product.invalidCtr > 0 ? invalidExtraError : invalidOrderError)
            return;
        }
        const variantSelect = document.getElementById(`variant-${product.id}`);
        const variant = (variantSelect ? variantSelect.value : null);
        // Wait for the product item to be rendered 
        const productItem = document.querySelector(`.product-item[data-id="${productId}"]`);
        if (productItem) { // Check if the element exists
            const cartItem = { ...product, variant, quantity: 1, selectedExtras: [...product.selectedExtras] };
            const existingItemIndex = cart.findIndex(item => item.id === productId && item.variant === variant && item.extraPrice === product.extraPrice);
            if (existingItemIndex >= 0) {
                cart[existingItemIndex].quantity += 1;
            } else {
                cart.push(cartItem);
            }
            updateCartCount();
            renderCartItems();
            saveCart();
        } else {
            console.error(`Product item with data-id "${productId}" not found.`);
        }
    };

    function renderCartItems() {
        cartItemsContainer.innerHTML = '';
        cart.forEach((item, index) => {
            const price = item.price + item.extraPrice;
            let extras = '';

            if (item.selectedExtras.length > 0) {
                extras = item.selectedExtras.map(extra => `${extraPrefix}${extra}`).join(', ') + " - ";
            }
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <p>${item.name}${item.variant ? ` - ${item.variant}` : ``} - ${extras}${displayPrice(price)} x ${item.quantity} 
  (${displayPrice(price * item.quantity)})</p>
                <button onclick="removeFromCart(${index})", class="remove-button">X</button>
            `;
            cartItemsContainer.appendChild(cartItem);
        });

        updateTotalPrice();
    }

    window.removeFromCart = function(index) {
        cart.splice(index, 1);
        renderCartItems();
        updateCartCount();
        saveCart();
    }

    function updateCartCount() {
        const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalCount;
        cartCount.style.display = totalCount > 0 ? 'inline' : 'none';
    }

    viewCartButton.addEventListener('click', () => {
        cartPane.classList.remove('close');
        cartPane.classList.add('open');
    });

    closeCartButton.addEventListener('click', () => {
        cartPane.classList.add('close');
        cartPane.classList.remove('open');
    });

    clearCartButton.addEventListener('click', () => {
        cart = [];
        renderCartItems();
        updateCartCount();
        saveCart();
    });

    // Close cart pane when clicking outside of it
    document.addEventListener('click', (event) => {
        if (!cartPane.contains(event.target) && !viewCartButton.contains(event.target)) {
            if (cartPane.classList.contains('open')) {
                cartPane.classList.remove('open');
                cartPane.classList.add('close');
            }
        }
    });

    cartItemsContainer.addEventListener('click', (event) => {
        // Check if the click is on a "Remove" button
        if (event.target.tagName === 'BUTTON' && event.target.classList.contains('remove-button')) {
            event.stopPropagation(); // Prevent event from bubbling up to document listener
        }
    });

    checkoutForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (cart.length === 0) {
            alert(emptyCartError);
            return;
        }

        if(delivaryFee === Infinity) {
            alert(invalidDestinationError);
            return;
          }

        const name = document.getElementById('name').value;
        const address = document.getElementById('address').value;
        const notes = document.getElementById('notes').value;
        const message = messageContent(name, address, notes);
        const whatsappLink = `https://wa.me/${encodeURIComponent(phoneNumber)}?text=${encodeURIComponent(message)}`;
        window.open(whatsappLink, '_blank');
    });

    // Load products from Google Sheets
    function loadProducts() {
        const sheetId = '1c1-REfGKjHZfWJKDFkC5intGjDoSoNQMzaAB0W9W3bw';
        const apiKey = 'AIzaSyD1QPxllBDeE8UDUfq5x6sME8T4kSmUTic';
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/products?key=${apiKey}`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                const rows = data.values;
                products = rows.slice(1).map((row, index) => ({
                    id: index + 1,
                    price: 0,
                    extraPrice: 0,
                    invalidCtr: 0,
                    selectedExtras: [],
                    name: row[0],
                    category: row[1],
                    description: row[2],
                    prices: row[3] ? row[3].split(',') : [],
                    image: row[4],
                    variants: row[5] ? row[5].split(',') : [],
                    extras: row[6] ? row[6].split(',') : [],
                    extraPrices: row[7] ? row[7].split(',') : []
                }));
                renderProducts(products);
                renderCategories();
            })
            .catch(error => console.error('Error fetching products:', error));
    }

    function renderCategories() {
        const categories = [...new Set(products.map(product => product.category))];
        categoryFilter.innerHTML = '<button class="filter-button active" data-category="all">الكل</button>';
        categories.forEach(category => {
            const button = document.createElement('button');
            button.className = 'filter-button';
            button.textContent = category;
            button.setAttribute('data-category', category);
            categoryFilter.appendChild(button);
        });
        const filterButtons = document.querySelectorAll('.filter-button');
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                const category = button.getAttribute('data-category');
                if (category === 'all') {
                    renderProducts(products);
                } else {
                    const filteredProducts = products.filter(product => product.category === category);
                    renderProducts(filteredProducts);
                }
            });
        });
    }

    function saveCart() {
        localStorage.setItem('cart', JSON.stringify(cart));
    }


    function loadZones() {
        const sheetId = '1c1-REfGKjHZfWJKDFkC5intGjDoSoNQMzaAB0W9W3bw';
        const apiKey = 'AIzaSyBLzQa0qCd2P40oFTZFyYWkVYk9hFhWetY';
        const range = 'ship!A1:B1000';
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`;

        fetch(url)
        .then(response => response.json())
        .then(data => {
          const rows = data.values;
          zones = rows.slice(1).map((row) => ({
            zone: row[0],
            price: row[1] ? (isNaN(parseFloat(row[1])) ? Infinity : parseFloat(row[1])) : Infinity
          }));
          delivaryFee = zones[0].price;
          updateTotalPrice();
        })
        .catch(error => console.error('Error fetching zones:', error));
        
      }

      function updateTotalPrice() {
        let orderPrice = 0;

        cart.forEach((item) => {
          orderPrice += (item.price + item.extraPrice)*item.quantity;
        });
        
        document.getElementById('total-price').textContent = displayPrice(delivaryFee + orderPrice);
      }

    // Initialize
    loadProducts();
    loadZones();
    renderCartItems();
    updateCartCount();
});
