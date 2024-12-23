import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import {
  doc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCYumMRj7DmKykBXz1qBEfdhbG0kkBM6K8",
  authDomain: "tienda-dc221.firebaseapp.com",
  projectId: "tienda-dc221",
  storageBucket: "tienda-dc221.firebasestorage.app",
  messagingSenderId: "890892755235",
  appId: "1:890892755235:web:4d5c3dd9cb2ae506ae2c96",
  measurementId: "G-9CPQ5JHHF1",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Variables globales
const inventario = []; // Arreglo local para productos
let reconocimiento; // Objeto para reconocimiento de voz

// Cargar productos desde Firestore al iniciar
async function cargarProductos() {
  console.log("Cargando productos...");
  try {
    const querySnapshot = await getDocs(collection(db, "productos"));
    querySnapshot.forEach((doc) => {
      inventario.push({ id: doc.id, ...doc.data() });
    });
    mostrarProductos(inventario);
    console.log("Productos cargados:", inventario);
  } catch (error) {
    console.error("Error al cargar productos:", error);
  }
}

// Mostrar productos en la página
// Mostrar productos en la página como tabla
function mostrarProductos(productos) {
  const productosTabla = document.getElementById("productosTabla");
  if (productos.length > 0) {
    productosTabla.innerHTML = productos
      .map(
        (p) =>
          `<tr>
            <td>${p.nombre}</td>
            <td>$${p.precio.toFixed(2)}</td>
          </tr>`
      )
      .join("");
  } else {
    productosTabla.innerHTML = `<tr><td colspan="2">No hay productos disponibles.</td></tr>`;
  }
}

// Agregar producto a Firestore
async function agregarProducto() {
  console.log("Intentando agregar producto...");
  const nombre = document.getElementById("nombreProducto").value.trim();
  const precio = parseFloat(document.getElementById("precioProducto").value);

  if (!nombre || isNaN(precio)) {
    alert("Por favor, ingresa un nombre y precio válidos.");
    return;
  }

  try {
    const docRef = await addDoc(collection(db, "productos"), {
      nombre,
      precio,
    });
    inventario.push({ id: docRef.id, nombre, precio });
    mostrarProductos(inventario);

    // Limpiar campos
    document.getElementById("nombreProducto").value = "";
    document.getElementById("precioProducto").value = "";
    alert("Producto agregado con éxito.");
  } catch (error) {
    console.error("Error al agregar producto:", error);
    alert("Hubo un error al agregar el producto.");
  }
}
// Eliminar producto por nombre
// Eliminar producto por nombre
async function eliminarProducto() {
  const nombreEliminar = document
    .getElementById("nombreEliminar")
    .value.trim()
    .toLowerCase();

  if (!nombreEliminar) {
    alert("Por favor, ingresa el nombre del producto a eliminar.");
    return;
  }

  // Buscar el producto en el inventario local
  const productoEncontrado = inventario.find(
    (item) => item.nombre.toLowerCase() === nombreEliminar
  );

  if (!productoEncontrado) {
    alert("Producto no encontrado.");
    return;
  }

  try {
    // Referencia al documento en Firestore
    const productoRef = doc(db, "productos", productoEncontrado.id);
    console.log("Eliminando producto con ID:", productoEncontrado.id);

    // Eliminar el documento
    await deleteDoc(productoRef);
    console.log("Producto eliminado de Firestore.");

    // Eliminar el producto del inventario local
    const indice = inventario.indexOf(productoEncontrado);
    if (indice > -1) inventario.splice(indice, 1);

    // Actualizar la tabla
    mostrarProductos(inventario);

    // Limpiar el campo de entrada
    document.getElementById("nombreEliminar").value = "";
    alert("Producto eliminado con éxito.");
  } catch (error) {
    console.error("Error al eliminar el producto:", error.message);
    alert("Hubo un error al intentar eliminar el producto.");
  }
}

// Funciones de reconocimiento de voz
function iniciarReconocimiento() {
  console.log("Iniciando reconocimiento de voz...");
  const boton = document.getElementById("botonEscucha");
  const botonDetener = document.getElementById("botonDetener");
  boton.textContent = "Escuchando...";
  botonDetener.style.display = "inline";

  if (!("webkitSpeechRecognition" in window)) {
    alert(
      "La API de reconocimiento de voz no es compatible con este navegador."
    );
    return;
  }

  reconocimiento = new webkitSpeechRecognition();
  reconocimiento.lang = "es-PE";
  reconocimiento.interimResults = false;

  reconocimiento.onresult = (event) => {
    const speechText = event.results[0][0].transcript.toLowerCase();
    console.log("Texto captado:", speechText);

    document.getElementById(
      "textoCaptado"
    ).textContent = `Lo que dijiste: ${speechText}`;

    const productosEncontrados = inventario.filter((item) =>
      item.nombre.toLowerCase().includes(speechText)
    );
    mostrarProductos(
      productosEncontrados.length > 0 ? productosEncontrados : []
    );
    boton.textContent = "Decir Producto";
  };

  reconocimiento.onerror = (error) => {
    console.error("Error en el reconocimiento de voz:", error);
    alert("Error en el reconocimiento de voz.");
    boton.textContent = "Decir Producto";
  };

  reconocimiento.onend = () => {
    console.log("Reconocimiento de voz terminado.");
    boton.textContent = "Decir Producto";
  };

  reconocimiento.start();
}

function detenerReconocimiento() {
  console.log("Deteniendo reconocimiento de voz...");
  if (reconocimiento) {
    reconocimiento.stop();
    document.getElementById("botonEscucha").textContent = "Decir Producto";
    document.getElementById("botonDetener").style.display = "none";
  }
}

// Hacer funciones accesibles desde HTML
// Hacer funciones accesibles desde HTML
window.agregarProducto = agregarProducto;
window.iniciarReconocimiento = iniciarReconocimiento;
window.detenerReconocimiento = detenerReconocimiento;
window.eliminarProducto = eliminarProducto; // Agregar eliminarProducto

// Cargar productos al inicio
cargarProductos();
