

//--------------------- Add products to cart --------------------------



async function addToCart(productId, price, user) {

    const URL = `/add-to-cart/${productId}/?price=${price}`;
    try {
        if (user) {
            const response = await fetch(URL, {
                method: "GET",
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        if (response.ok) {
            const data = await response.json();
            Swal.fire({
                icon: "success",
                title: data.message || "Product added to cart",
                showConfirmButton: false,
                timer: 1200,
            })
            updateCartCount()
        } else {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to add product to cart");
        }
    }
    else {
        Swal.fire({
            icon: 'warning',
            title: 'Please Login',
            text: 'You need to login to access your cart.',
            showCancelButton: true,
            confirmButtonText: 'Login',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.href = '/login';
            }
        });
    }
    } catch (err) {
        Swal.fire({
            icon: "warning",
            title: err.message,
            text: "Available Soon"
        });
    }
}


//--------------------- wishlist --------------------------

async function addwishlist(productId, price, user) {

    const URL = `/add-wishlist/${productId}/?price=${price}`;
    try {
        if (user) {
            const response = await fetch(URL, {
                method: "GET",
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const data = await response.json();
                Swal.fire({
                    icon: "success",
                    title: data.message || "Product added to wishlist",
                    showConfirmButton: false,
                    timer: 1200,
                })

                updateWishlistCount();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to add product to wishlist");
            }
        }else {
            Swal.fire({
                icon: 'warning',
                title: 'Please Login',
                text: 'You need to login to access your wishlist.',
                showCancelButton: true,
                confirmButtonText: 'Login',
                cancelButtonText: 'Cancel'
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = '/login';
                }
            });
        }
    } catch (err) {
        Swal.fire({
            icon: "warning",
            title: err.message,
            text: "Available Soon"
        });
    }
}


//--------------------- wishlist count update function --------------------------



async function updateWishlistCount() {
    try {
        const res = await fetch('/wishlist/count');
        if (res.ok) {
            const data = await res.json();
            const count = data.count || 0;
            const badge = document.getElementById('wishlist-count');
            
            if (count > 0) {
                badge.textContent = count.toString();
                badge.style.display = 'flex'; // 💡 Make it visible!
            } else {
                badge.textContent = '';
                badge.style.display = 'none'; // Hide when empty
            }
        }
    } catch (error) {
        console.error('Failed to update wishlist count:', error);
    }
}


//--------------------- cart count update function --------------------------



async function updateCartCount() {
    try {
        const res = await fetch('/cart/count');
        if (res.ok) {
            const data = await res.json();
            const count = data.count || 0;
            const badge = document.getElementById('cart-count');
            
            if (count > 0) {
                badge.textContent = count.toString();
                badge.style.display = 'flex'; 
            } else {
                badge.textContent = '';
                badge.style.display = 'none'; 
            }
        }
    } catch (error) {
        console.error('Failed to update wishlist count:', error);
    }
}
