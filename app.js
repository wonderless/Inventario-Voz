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
            <td>${p.ubicacion}</td>
            <td>
              <div style="display: flex; align-items: center;">
                <button 
                  onclick="cambiarCantidad('${p.idProducto}', -1)" 
                  style="width: 30px; height: 30px; font-size: 16px;">−</button>
                <input 
                  type="number" 
                  id="cantidad-${p.idProducto}" 
                  value="1" 
                  min="1" 
                  style="width: 50px; text-align: center;" 
                  readonly />
                <button 
                  onclick="cambiarCantidad('${p.idProducto}', 1)" 
                  style="width: 30px; height: 30px; font-size: 16px;">+</button>
              </div>
              <button 
                onclick="realizarVenta('${p.idProducto}', '${p.nombre}', ${
            p.precio
          })" 
                style="margin-top: 10px;">Vender</button>
            </td>
          </tr>`
      )
      .join("");
  } else {
    productosTabla.innerHTML =
      '<tr><td colspan="4">No hay productos disponibles.</td></tr>';
  }
}

function cambiarCantidad(id, cambio) {
  const input = document.getElementById(`cantidad-${id}`);
  const nuevaCantidad = Math.max(1, parseInt(input.value) + cambio);
  input.value = nuevaCantidad;
}

// Agregar producto a Firestore
// Agregar producto con ID numérico
async function agregarProducto() {
  console.log("Intentando agregar producto...");
  const nombre = document.getElementById("nombreProducto").value.trim();
  const precio = parseFloat(document.getElementById("precioProducto").value);
  const ubicacion = document.getElementById("ubicacionProducto").value.trim();

  if (!nombre || isNaN(precio) || !ubicacion) {
    alert("Por favor, ingresa un nombre, precio y ubicación válidos.");
    return;
  }

  try {
    // Generar un ID único solo numérico para el producto
    const idProducto = Date.now(); // Usar timestamp como ID único

    const docRef = await addDoc(collection(db, "productos"), {
      idProducto, // ID numérico único
      nombre,
      precio,
      ubicacion,
    });

    inventario.push({
      id: docRef.id, // ID de Firestore para referencia
      idProducto, // ID único numérico
      nombre,
      precio,
      ubicacion,
    });
    mostrarProductos(inventario);

    // Limpiar campos
    document.getElementById("nombreProducto").value = "";
    document.getElementById("precioProducto").value = "";
    document.getElementById("ubicacionProducto").value = "";
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

// Agregar venta con fecha dividida
async function realizarVenta(idProducto, nombreProducto, precioUnitario) {
  const cantidadInput = document.getElementById(`cantidad-${idProducto}`);
  const cantidad = parseInt(cantidadInput.value);

  if (isNaN(cantidad) || cantidad <= 0) {
    alert("Por favor, ingresa una cantidad válida.");
    return;
  }

  const total = cantidad * precioUnitario;

  // Dividir la fecha en fecha1 y fecha2
  const now = new Date();
  const fecha1 = `${now.getFullYear()}-${(now.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}`;
  const fecha2 = `${now.getHours().toString().padStart(2, "0")}:${now
    .getMinutes()
    .toString()
    .padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;

  try {
    await addDoc(collection(db, "ventas"), {
      idProducto, // ID numérico único generado al registrar el producto
      nombreProducto,
      cantidad,
      total,
      fecha1, // Año, mes, día
      fecha2, // Hora, minuto, segundo
    });

    alert(
      `Venta realizada: ${cantidad} unidades de "${nombreProducto}" por $${total.toFixed(
        2
      )}.`
    );
  } catch (error) {
    console.error("Error al registrar la venta:", error);
    alert("Hubo un error al registrar la venta.");
  }
}

// Descargar datos de ventas en CSV
document
  .getElementById("descargarVentas")
  .addEventListener("click", async () => {
    try {
      const ventasSnapshot = await getDocs(collection(db, "ventas"));
      const ventas = [];

      ventasSnapshot.forEach((doc) => {
        ventas.push(doc.data());
      });

      if (ventas.length === 0) {
        alert("No hay ventas registradas para descargar.");
        return;
      }

      // Convertir los datos a formato CSV
      const csvContent = convertirVentasACSV(ventas);

      // Crear un archivo descargable
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "ventas.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error al obtener las ventas:", error);
      alert("Hubo un error al descargar las ventas.");
    }
  });

function convertirVentasACSV(ventas) {
  const headers = [
    "idProducto",
    "nombreProducto",
    "cantidad",
    "total",
    "fecha1",
    "fecha2",
  ];
  const rows = ventas.map((venta) =>
    headers.map((header) => venta[header] || "").join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}

// Hacer funciones accesibles desde HTML
// Hacer funciones accesibles desde HTML
window.agregarProducto = agregarProducto;
window.cambiarCantidad = cambiarCantidad;
window.iniciarReconocimiento = iniciarReconocimiento;
window.detenerReconocimiento = detenerReconocimiento;
window.eliminarProducto = eliminarProducto;
window.realizarVenta = realizarVenta; // Hacer accesible realizarVenta

// Cargar productos al inicio
cargarProductos();
