const slides = document.querySelectorAll(".slide"); 
const tl = gsap.timeline({ repeat: -1 }); 

slides.forEach((slide, index) => {
  tl.to(slide, {
    opacity: 1,
    duration: 1, 
    delay:0.1, 
  })
  .to(slide, {
    opacity: 0,
    duration: 1,
    delay:1, 
  });
});

const but = document.querySelectorAll("button");
but.forEach((b)=>{  
b.addEventListener("mouseover", function(){
    gsap.to(b, {
      rotate: 10,
      duration: 0.3,
    });
    gsap.from(b, {
      rotate:-20,
      duration: 0.3,
      delay: 0.2,
    });
  });
});
//index.html
const b = document.querySelectorAll(".categories");
b.forEach(button => {
  button.addEventListener('click', async function () {
    console.log("button clicked");
    const categoryId = this.getAttribute('data-id');
    console.log("Category ID:", categoryId);  // Debugging statement

    try {
      // Fetch data from the backend API
      const response = await fetch(`https://selfbliss-ecommerce1.onrender.com/category-products/${categoryId}`);
      
      if (response.ok) {
        const categoryProducts = await response.json();
        console.log(categoryProducts, "Category Products");

        // Store the category data in localStorage
        localStorage.setItem("cat", JSON.stringify(categoryProducts));

        // Redirect to the category page
        window.location.href = "/categories.html";
      } else {
        console.log("No data available for this category");
      }
    } catch (error) {
      console.error("Error fetching data: ", error);
    }
  });
});
//wishlist.html
    const buttons = document.querySelectorAll('.add-to-wishlist');
    if (buttons) {
      buttons.forEach(butto => {
        butto.addEventListener('click', (e) => {
          const productId = e.target.dataset.id;
          console.log('Product ID:', productId);
         addToWishlist(productId);
         
        });
      });
    } else {
      console.error('Buttons not found!');
    }
    async function addToWishlist(productId) {
  
      try {
        const response = await fetch("https://selfbliss-ecommerce1.onrender.com/wishlist", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ productId }),
        });
    if (response.status===401){
      const data=await response.json();
      alert("You need to log in to access your wishlist.");
      window.location.href = data.redirect; 
    }else{ 
      if(response.ok){
          console.log(response);
          const data=await response.json();
          if (response.ok && data.success) {
            alert(data.message);
            window.location.href = "/wishlist";
      } else {
        alert(data.message || "Failed to add product");
      }
        } else {
          const error = await response.json();
          alert(`Error: ${error.message}`);
        }
      } }catch (err) {
        console.error("Failed to add to wishlist:", err);
      }
    }

//cart.html
  document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.add-to-cart');
    if (buttons) {
      buttons.forEach(button => {
        button.addEventListener('click', (e) => {
          const productId = e.target.dataset.id;
          console.log('Product ID:', productId);
          addToCart(productId);
        });
      });
    } else {
      console.error('Buttons not found!');
    }
    async function addToCart(productId) {
 
      try {
        const response = await fetch("https://selfbliss-ecommerce1.onrender.com/cart", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ productId }),
        });
        console.log(response);
        if (response.status===401){
          const data=await response.json();
          alert("You need to log in to access your cart.");
          window.location.href = data.redirect; 
        }else{
          if(response.ok){
            console.log(response);
            const data=await response.json();
            if (response.ok && data.success) {
              alert(data.message);
              window.location.href = "/cart";
        } else {
          alert(data.message || "Failed to add product");
        }
          } else {
            const error = await response.json();
            alert(`Error: ${error.message}`);
          }
        } }catch (err) {
        console.error("Failed to add to cart:", err);
      }
    }
});
