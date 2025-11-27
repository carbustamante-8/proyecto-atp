// frontend/app/api/ordenes-trabajo/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

type Context = {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: Context) {
  try {
    const params = await context.params;
    const otDoc = await adminDb.collection('ordenes-trabajo').doc(params.id).get();
    if (!otDoc.exists) return NextResponse.json({ error: 'OT no encontrada' }, { status: 404 });
    return NextResponse.json({ id: otDoc.id, ...otDoc.data() });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener la OT' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: Context) {
  try {
    const params = await context.params;
    const id = params.id; 
    const body = await request.json(); 

    const datosActualizados: any = {};

    // --- LÓGICA DE ESTADOS ---
    
    // 1. Guardia: Registrar Llegada
    if (body.accion === 'registrarLlegada') {
      datosActualizados.estado = 'Pendiente'; 
      datosActualizados.fechaIngresoTaller = admin.firestore.FieldValue.serverTimestamp(); 
    }
    
    // 2. Guardia: Registrar Salida
    else if (body.accion === 'registrarSalida') {
      datosActualizados.fechaSalidaTaller = admin.firestore.FieldValue.serverTimestamp();
    }

    // 3. Admin: Asignar Tarea (MEJORADO: Busca el nombre si falta)
    else if (body.accion === 'asignarTarea' && body.mecanicoAsignadoId) {
      datosActualizados.mecanicoAsignadoId = body.mecanicoAsignadoId;
      datosActualizados.estado = 'Asignada';

      // SI EL FRONTEND NO MANDÓ EL NOMBRE, LO BUSCAMOS EN LA BD DE USUARIOS
      if (!body.mecanicoAsignadoNombre) {
          try {
              const usuarioDoc = await adminDb.collection('usuarios').doc(body.mecanicoAsignadoId).get();
              if (usuarioDoc.exists) {
                  const dataUser = usuarioDoc.data();
                  datosActualizados.mecanicoAsignadoNombre = dataUser?.nombre || 'Mecánico Desconocido';
              } else {
                  datosActualizados.mecanicoAsignadoNombre = 'ID no encontrado';
              }
          } catch (e) {
              console.error("Error buscando nombre de mecánico:", e);
              datosActualizados.mecanicoAsignadoNombre = 'Error al buscar nombre';
          }
      } else {
          // Si el frontend sí lo mandó, lo usamos directo
          datosActualizados.mecanicoAsignadoNombre = body.mecanicoAsignadoNombre;
      }
    } 
    
    // 4. Mecánico: Gestión de Avance
    else if (['En Progreso', 'Finalizado', 'Asignada'].includes(body.estado)) {
      datosActualizados.estado = body.estado;
    }
    
    // 5. Admin: Cerrar OT
    else if (body.accion === 'cierreAdministrativo') {
      datosActualizados.estado = 'Cerrado';
      datosActualizados.fechaCierreAdministrativo = admin.firestore.FieldValue.serverTimestamp(); 
    }
    // 6. Anular
    else if (body.accion === 'anularOT') {
        datosActualizados.estado = 'Anulado';
        datosActualizados.fechaAnulacion = admin.firestore.FieldValue.serverTimestamp();
    }
    
    // Datos extra
    if (body.repuestosUsados !== undefined) datosActualizados.repuestosUsados = body.repuestosUsados;
    if (body.nuevaFotoURL) datosActualizados.fotos = admin.firestore.FieldValue.arrayUnion(body.nuevaFotoURL);

    // Ejecutar actualización
    await adminDb.collection('ordenes-trabajo').doc(id).update(datosActualizados);

    return NextResponse.json({ message: 'OT actualizada' });

  } catch (error) {
    console.error(`Error PUT /api/ordenes-trabajo:`, error); 
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}