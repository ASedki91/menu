
    // Example function to switch to English (used in index.html)
    function switchToEnglish() {
        window.location.href = "/en/index_en.html";
        language = 1;
    }

    // Example function to switch to Default Language (used in index_en.html)
    function switchToDefault() {
        window.location.href = "/index.html";
        language = 0;
    }
    const language = window.location.pathname.includes('/en') ? 1 : 0;


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
    const extraPrefix = ["اضافة ", "Extra "];
    const RTLLayout = [true, false];
    const invalidPriceTag = '-';
    const hideCurrencyWhenInvalidChoice = true;
    const phoneNumber = "+971556260381";
    const emptyCartError = ["برجاء اضافة طلبات للسلة قبل ارسال الطلب", "Please add items to the cart before sending the order."];
    const invalidOrderError = ['طلب غير صالح', "Invalid Order."];
    const invalidExtraError = ['اضافة غير صالحة', "Invalid Extra."];
    const invalidDestinationError = ['منطقة توصيل غير صالحة', "Invalid delivary zone."];
    const extrasKeyWord = [`إضافات`, `Extras`];
    const addToCartWord = ["أضف إلى السلة", "Add to cart"];
    const allCategory = ["الكل", "All"];
    let stuffLoaded = 0;


    //you can edit the message via editing the text and the following variables:
    //seperator: the seperator between orders
    function messageContent(name, address, notes) {
        const directionMark = RTLLayout[language] ? `\u200F` : `\u200E`;
        const seperator = `\n\n${directionMark}--------------------------------\n\n`;

        const details = [
            `${directionMark}مرحبا, اود تقديم طلب.\n\n`

            + `${directionMark}اريد تسليمه الى: ${address}\n\n`

            + `${directionMark}الاسم: ${name}\n\n`

            + `${directionMark}ملاحظات: ${notes}`,

            `${directionMark}Hello, I'd like to make an order.\n\n`

            + `${directionMark}I'd like it sent to: ${address}\n\n`

            + `${directionMark}Name: ${name}\n\n`

            + `${directionMark}Notes: ${notes}`];


        let message = details[language];
        //for cart items use:
        //itemProduct.name, item.variant, item.price, item.extraPrice, item.quantity, item.selectedExtras
        
        message += seperator;
        let totalPrice = 0;
        cart.forEach((item) => {
            const itemProduct = products[item.id-1];
            let extras = '';
            const variant = (itemProduct.variants.length > item.variant ? ` ${itemProduct.variants[item.variant]}` : ``);

            if (item.selectedExtras.length > 0) {
                //you can edit the "join" to change the seperator between extras
                extras = `\n${directionMark}${item.selectedExtras.map(extra => `${extraPrefix[language]}${itemProduct.extras[extra]}`).join(', ')}\t${displayPrice(item.extraPrice)}`;
            }


            message += `${directionMark}${item.quantity} x ${itemProduct.name}${variant}\t${displayPrice(item.price)}${extras}\n`;

            const productTotal = (item.price + item.extraPrice) * item.quantity;
            const productTotalSection = [
                `${directionMark}إجمالي المنتج: \t${displayPrice(productTotal)}`,
                `${directionMark}Product Total: \t${displayPrice(productTotal)}`
            ];
            message += productTotalSection[language];
            message += seperator;

            totalPrice += productTotal;
        });

        const finalDetails = [
            `${directionMark}سعر الطلب: ${displayPrice(totalPrice)}`
            + '\n'
            + `${directionMark}سعر التوصيل: ${displayPrice(delivaryFee)}`
            + '\n'
            + `${directionMark}السعر النهائي: ${displayPrice(totalPrice+delivaryFee)}`,

            `${directionMark}Order Price: ${displayPrice(totalPrice)}`
            + '\n'
            + `${directionMark}Delivery Fee: ${displayPrice(delivaryFee)}`
            + '\n'
            + `${directionMark}Final Price: ${displayPrice(totalPrice+delivaryFee)}`
        ];

        message += finalDetails[language];

        return message;
    }




    function directionChanges() {
        document.body.style.direction = RTLLayout[language] ? 'rtl' : 'ltr';

        // if(RTLLayout[language]) {
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

    function arraysAreEqual(arr1, arr2) {
        if (arr1.length !== arr2.length) {
            return false; // Arrays have different lengths, so they can't be equal
        }
    
        // Sort both arrays
        const sortedArr1 = arr1.slice().sort();
        const sortedArr2 = arr2.slice().sort();
    
        // Compare sorted arrays
        for (let i = 0; i < sortedArr1.length; i++) {
            if (sortedArr1[i] !== sortedArr2[i]) {
                return false; // Arrays are not equal
            }
        }
    
        return true; // Arrays are equal
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
                    <h3>${extrasKeyWord[language]}</h3>
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
                                product.selectedExtras.push(index);
                            } else {
                                product.invalidCtr++;
                            }
                        } else {
                            if (isFinite(extraPrice)) {
                                product.extraPrice -= extraPrice;
                                product.selectedExtras.splice(product.selectedExtras.indexOf(index), 1);
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
            addToCartButton.textContent = `${addToCartWord[language]}`;
            addToCartButton.onclick = () => addToCart(product.id);
            productItem.appendChild(addToCartButton);
        });
    }

    window.addToCart = function(productId) {
        const product = products[productId-1];
        if (product.invalidCtr > 0 || !isFinite(product.price)) {
            alert(product.invalidCtr > 0 ? invalidExtraError[language] : invalidOrderError[language])
            return;
        }
        const variantSelect = document.getElementById(`variant-${product.id}`);
        const variant = (variantSelect ? variantSelect.selectedIndex : null);
        // Wait for the product item to be rendered 
        const productItem = document.querySelector(`.product-item[data-id="${productId}"]`);
        if (productItem) { // Check if the element exists
            const cartItem = { id: product.id, variant, quantity: 1, selectedExtras: [...product.selectedExtras] };
            const existingItemIndex = cart.findIndex(item => item.id === productId && item.variant === variant && arraysAreEqual(item.selectedExtras, product.selectedExtras));
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

    function checkExtra(productID, extraPrices) {
        const len = products[productID-1].extras.length;

        return extraPrices.every(idx => idx < len);
    }

    function renderCartItems() {
        cartItemsContainer.innerHTML = '';
        cart = cart.filter(
            item => products.length >= item.id &&
            products[item.id-1].variants.length >= item.variant &&
            checkExtra(item.id, item.selectedExtras)
        );

        cart.forEach((item, index) => {
            const itemProduct = products[item.id-1];
            item.price = itemProduct.price;
            item.extraPrice = 0;
            item.selectedExtras.forEach((extraID, index) => {
                item.extraPrice += setWithIdx(extraID, itemProduct.extraPrices);
            })

            const price = item.price + item.extraPrice;
            let extras = '';

            if (item.selectedExtras.length > 0) {

                extras = item.selectedExtras.map(extra => `${extraPrefix[language]}${itemProduct.extras[extra]}`).join(', ') + " - ";
            }
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <p>${itemProduct.name}${itemProduct.variants.length > item.variant ? ` - ${itemProduct.variants[item.variant]}` : ``} - ${extras}${displayPrice(price)} x ${item.quantity} 
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
        if(stuffLoaded < 2) return;
        if (cart.length === 0) {
            alert(emptyCartError[language]);
            return;
        }

        if(delivaryFee === Infinity) {
            alert(invalidDestinationError[language]);
            return;
          }

        const name = document.getElementById('name').value;
        const address = document.getElementById('address').value;
        const notes = document.getElementById('notes').value;
        const message = messageContent(name, address, notes);
        const whatsappLink = `https://wa.me/${encodeURIComponent(phoneNumber)}?text=${encodeURIComponent(message)}`;
        window.open(whatsappLink, '_blank');
    });

    function fetchLanguage() {
        const sheetId = '1c1-REfGKjHZfWJKDFkC5intGjDoSoNQMzaAB0W9W3bw';
        const apiKey = 'AIzaSyD1QPxllBDeE8UDUfq5x6sME8T4kSmUTic';
        const languageRange = "en!A:D";
        const langurl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${languageRange}?key=${apiKey}`;

        fetch(langurl)
            .then(response => response.json())
            .then(data => {
                const rows = data.values;
                rows.slice(1).forEach((row, index) => {
                    
                    if(index < products.length) {
                        
                        products[index].name = row[0];
                        products[index].category = row[1];
                        products[index].extras = row[2] ? row[2].split(',') : [];
                        products[index].variants = row[5] ? row[5].split(',') : [];
                    }
                    
                });
                renderProducts(products);
                renderCategories();
                renderCartItems();
                updateCartCount();
                if(stuffLoaded == 1)
                    updateTotalPrice();
                stuffLoaded++;
            })
            .catch(error => console.error('Error fetching products:', error));
    }

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
                if(language == 0) {
                    renderProducts(products);
                    renderCategories();
                    renderCartItems();
                    updateCartCount();
                    if(stuffLoaded == 1)
                        updateTotalPrice();
                    stuffLoaded++;
                }
                else {
                    fetchLanguage();
                }
            })
            .catch(error => console.error('Error fetching products:', error));
    }

    function renderCategories() {
        const categories = [...new Set(products.map(product => product.category))];
        categoryFilter.innerHTML = `<button class="filter-button active" data-category="all">${allCategory[language]}</button>`;
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
          if(stuffLoaded == 1)
            updateTotalPrice();
          stuffLoaded++;
        })
        .catch(error => console.error('Error fetching zones:', error));
        
      }

      function updateTotalPrice() {
        let orderPrice = 0;

        cart.forEach((item) => {
            const itemProduct = products[item.id-1];
          orderPrice += (itemProduct.price + item.extraPrice)*item.quantity;
        });
        
        document.getElementById('total-price').textContent = displayPrice(delivaryFee + orderPrice);
      }

    // Initialize
    loadProducts();
    loadZones();
    
});
