import express from "express";
import pg from "pg";
import bcrypt from "bcryptjs";
import bodyParser from "body-parser";
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-local";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, get,push,set,child,update,remove } from "firebase/database";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';  
import cors from 'cors';

const app = express();

app.use(cors({
  origin: 'https://selfbliss--1.onrender.com', // your frontend domain
  credentials: true
}));
const port = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use(express.static(join(__dirname, '../frontend')));
const firebaseConfig = {
  authDomain: "selfbliss-e4cad.firebaseapp.com",
  databaseURL: "https://selfbliss-e4cad-default-rtdb.firebaseio.com",
  projectId: "selfbliss-e4cad",
  storageBucket: "selfbliss-e4cad.firebasestorage.app",
  messagingSenderId: "997141981475",
  appId: "1:997141981475:web:ff4bef09c3f77c0cfa8496",
  measurementId: "G-M8V2MZ6ZRQ"
};
console.log("Firebase config:", firebaseConfig);
const a = initializeApp(firebaseConfig);
const database = getDatabase(a);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret:"gewqnbh",
  resave: false,
  saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {
  res.sendFile("/web dev/mine/SelfBliss/frontend/index.html");
});
app.get("/login", (req, res) => {
  res.sendFile("/web dev/mine/SelfBliss/frontend/login.html");
});
app.get("/categories", (req, res) => {
  res.sendFile("/web dev/mine/SelfBliss/frontend/categories.html");
});
app.get("/wishlist", (req, res) => {
  if (!req.isAuthenticated()) {
    console.log("User not authenticated, redirecting...");
    res.redirect("/login");
  }
  res.sendFile("/web dev/mine/SelfBliss/frontend/wishlist.html");
});
app.get("/cart", (req, res) => {
  if (!req.isAuthenticated()) {
    console.log("User not authenticated, redirecting...");
    return res.redirect("/login");
  }
  res.sendFile("/web dev/mine/SelfBliss/frontend/cart.html");
});
//index.html
app.get('/category-products/:categoryId', async (req, res) => {
  const categoryId = req.params.categoryId;
  try {
    const categoryRef = ref(database, `products/${categoryId}`);
    const snapshot = await get(categoryRef);
    console.log("index", categoryRef);

    if (snapshot.exists()) {
      // If data exists, send it back as JSON
      const categoryProducts = snapshot.val();
      res.json(categoryProducts);
    } else {
      // If no data exists for the category, return a 404 status
      res.status(404).json({ message: 'Category not found' });
    }
  } catch (error) {
    // Handle any error that occurs
    res.status(500).json({ error: 'Error fetching data', message: error.message });
  }
});
//wishlist.html
async function findCategoryIdByProductId(database, productId) {
  console.log("function called");
  const productsRef = ref(database, 'products');
  const snapshot = await get(productsRef);

  if (!snapshot.exists()) return null;

  const productsData = snapshot.val();
let foundCategoryId = null;
  for (const categoryId in productsData) {
    console.log("------------------------------")
  const categoryProducts = productsData[categoryId];
  console.log("category product", categoryProducts);
  for (const key in categoryProducts) {
    console.log("key", key);
    const product = categoryProducts[key];
    console.log(product);
    if (String(product.product_id) === String(productId)) {
      foundCategoryId = categoryId;
      return foundCategoryId;
    }
  }
  }
  return null;
}
app.get('/allwishlist', async (req, res) => {
  console.log("-------------------------------------------");
  if (!req.isAuthenticated()) {
    return res.status(401).json({ redirect: "/login" });
  }
  const ui = req.user;
  const uu = Object.keys(ui);
  const userId = uu[0];
  try {
    // 1. Get all wishlist entries (only categoryId stored)
    const wishlistRef = ref(database, `users/${userId}/wishlist`);
    const wishlistSnap = await get(wishlistRef);
    if (!wishlistSnap.exists()) {
      return res.status(200).json({ wishlist: [] }); // empty wishlist
    }
    const wishlistData = wishlistSnap.val(); // {productId: {categoryId}}
console.log("wishlist data", wishlistData);
    // 2. Get all products
    const productsRef = ref(database, 'products');
    const productsSnap = await get(productsRef);
    if (!productsSnap.exists()) {
      return res.status(500).json({ error: "Products not found in DB" });
    }
    const productsData = productsSnap.val();
console.log("product data", productsData);
    const finalWishlist = [];

    // 3. Loop over wishlist and find product details
    for (const productId in wishlistData) {
      console.log("-------------------------------------------");
      const { categoryId } = wishlistData[productId];
console.log("category id", categoryId);
      const categoryProducts = productsData[categoryId];
      console.log("category product", categoryProducts);
      if (categoryProducts) {
        for (const key in categoryProducts) {
          console.log("key",key);
          const product = categoryProducts[key];
          console.log("product",product);
          if (String(product.product_id) === String(productId)) {
            finalWishlist.push(product);
            console.log("final wihslisy", finalWishlist);
            break;
          }
        }
      }
    }
    return res.status(200).json({ wishlist: finalWishlist });

  } catch (error) {
    console.error("Error loading wishlist:", error);
    return res.status(500).json({ error: "Failed to load wishlist" });
  }
});


app.get('/allcart', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ redirect: "/login" });
  }
  const ui = req.user;
  const uu = Object.keys(ui);
  const userId = uu[0];
  try {
    const cartRef = ref(database, `users/${userId}/cart`);
    const cartSnap = await get(cartRef);
    if (!cartSnap.exists()) {
      return res.status(200).json({ cart: [] });
    }
    const cartData = cartSnap.val(); // { productId: { categoryId, quantity } }
    const productsRef = ref(database, 'products');
    const productsSnap = await get(productsRef);
    if (!productsSnap.exists()) {
      return res.status(500).json({ error: "Products not found in DB" });
    }
    const productsData = productsSnap.val();
    const finalCart = [];
    for (const productId in cartData) {
      const { categoryId, quantity } = cartData[productId];
      const categoryProducts = productsData[categoryId];
      if (categoryProducts) {
        for (const key in categoryProducts) {
          const product = categoryProducts[key];
          if (String(product.product_id) === String(productId)) {
            finalCart.push({ ...product, quantity });
            break;
          }
        }
      }
    }

    return res.status(200).json({ cart: finalCart });

  } catch (error) {
    console.error("Error loading cart:", error);
    return res.status(500).json({ error: "Failed to load cart" });
  }
});

 app.delete('/wishlist/:productId', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ redirect: "/login" });
  }

  const ui = req.user;
  const uu = Object.keys(ui);
  const userId = uu[0];
  const productId = req.params.productId;

  try {
    const wishlistRef = ref(database, `users/${userId}/wishlist/${productId}`);
    await remove(wishlistRef);
    return res.status(200).json({ message: "Product removed from wishlist" });
  } catch (error) {
    console.error("Error deleting from wishlist:", error);
    return res.status(500).json({ error: "Failed to delete from wishlist" });
  }
});

app.delete('/cart/:productId', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ redirect: "/login" });
  }

  const ui = req.user;
  const uu = Object.keys(ui);
  const userId = uu[0];
  const productId = req.params.productId;

  try {
    const cartRef = ref(database, `users/${userId}/cart/${productId}`);
    await remove(cartRef);
    return res.status(200).json({ message: "Product removed from cart" });
  } catch (error) {
    console.error("Error deleting from cart:", error);
    return res.status(500).json({ error: "Failed to delete from cart" });
  }
});


app.delete('/minuscart/:product_id', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ redirect: "/login" });
  }

  const pid = req.params.product_id;
  const ui = req.user;
  const uid = Object.keys(ui)[0]; // assuming your user ID extraction method

  console.log("minus", pid, uid);

  try {
    // 1. Get current quantity
    const cartRef = ref(database, `users/${uid}/cart/${pid}`);
    const snapshot = await get(cartRef);

    if (!snapshot.exists()) {
      return res.status(404).json({ success: false, message: "Product not found in cart" });
    }

    const cartItem = snapshot.val();
    let currentQuantity = cartItem.quantity || 1;

    if (currentQuantity <= 1) {
      // Remove product from cart if quantity is 1 or less
      await remove(cartRef);
      return res.json({ success: true, message: "Product removed from cart" });
    } else {
      // Decrement quantity by 1
      const newQuantity = currentQuantity - 1;
      await update(cartRef, { quantity: newQuantity });
      return res.json({ success: true, message: "Product quantity decreased", quantity: newQuantity });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Failed to update cart" });
  }
});

app.post('/wishlist', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ redirect: "/login" });
  }
  const { productId } = req.body;
   const ui= req.user;
  const uu=Object.keys(ui);
  const userId=uu[0];
console.log("pid and uisd", productId, userId);
  if (!productId || !userId) {
    return res.status(400).json({ error: "Missing userId or productId" });
  }

  try {
    const categoryId = await findCategoryIdByProductId(database, productId);
    console.log("cid", categoryId);
    if (!categoryId) {
      return res.status(404).json({ error: "Product not found" });
    }
    const productRef = ref(database, `users/${userId}/wishlist/${productId}`);
    const snapshot = await get(productRef);
    if (snapshot.exists()) {
      return res.status(200).json({ message: "Product already in wishlist" });
    } else {
      const updates = {};
      updates[`users/${userId}/wishlist/${productId}`] = { categoryId };
      await update(ref(database), updates);
      return res.status(200).json({ message: "Product added to wishlist", categoryId });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});


app.post('/cart', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ redirect: "/login" });
  }

  const { productId } = req.body;
  const ui = req.user;
  const uu = Object.keys(ui);
  const userId = uu[0];

  console.log("pid and uid", productId, userId);

  if (!productId || !userId) {
    return res.status(400).json({ error: "Missing userId or productId" });
  }

  try {
    const categoryId = await findCategoryIdByProductId(database, productId);
    console.log("cid", categoryId);
    if (!categoryId) {
      return res.status(404).json({ error: "Product not found" });
    }

    const productRef = ref(database, `users/${userId}/cart/${productId}`);
    const snapshot = await get(productRef);

    if (snapshot.exists()) {
      // If product already in cart, increment quantity by 1
      const existingData = snapshot.val();
      const newQuantity = (existingData.quantity || 1) + 1;
      await update(productRef, { quantity: newQuantity });
      return res.status(200).json({ message: "Product quantity updated in cart", quantity: newQuantity });
    } else {
      // Add product with quantity 1
      await set(productRef, { categoryId, quantity: 1 });
      return res.status(200).json({ message: "Product added to cart with quantity 1", categoryId });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});


// User Registration (Sign Up)
app.post('/register', async (req, res) => {
  const {user_name, phone_no, email, password } = req.body;
  console.log(req.body);
  const hashedPassword = bcrypt.hashSync(password, 8);  // Hash password
  const userref=ref( database, `users/`);
  const newuserref=push(userref);
  const finalData={ username:user_name, phoneno:phone_no, email:email, password:hashedPassword};
  console.log(finalData);
  try {
    await set(newuserref,finalData);
    const user={id:newuserref.key, username:user_name, phoneno: phone_no, email:email, password:hashedPassword};
    req.login(user, (err) => {
      console.log("success");
      res.redirect("/");
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
  })
);
passport.use(
  new Strategy(async function verify(name, password, cb) {
    try {
       const userRef = ref(database, `users/`);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
      // If data exists, send it back as JSON
      const user = snapshot.val();
      let matchedUser=null;
      for ( const key in user){
        if(user[key].username===name){
          matchedUser=user[key];
           
        }
      }
      if(!matchedUser){
         return cb(null, false);
      }
      const storedHashedPassword = matchedUser.password;
      bcrypt.compare(password, storedHashedPassword, (err, valid) => {
          if (err) {
            //Error with password check
            console.error("Error comparing passwords:", err);
            return cb(err);
          } else {
            if (valid) {
              //Passed password check
              return cb(null, user);
            } else {
              //Did not pass password check
              return cb(null, false);
            }
          }
        });
      } else {
        return cb("User not found");
      }
    }catch (err) {
      console.log(err);
    }
  })
);

passport.serializeUser((user, cb) =>{
  cb(null,user);
});
passport.deserializeUser((user, cb)=>{
  cb(null, user);
});
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
