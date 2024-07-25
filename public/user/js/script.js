

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

