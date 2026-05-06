// File: backend/src/controllers/meetingController.js
const {
    createMeeting: createMeetingModel,
    addMeetingParticipants,
    getUserMeetings,
    getProjectMeetings: getProjectMeetingsModel,
    getMeetingById: getMeetingByIdModel,
    getMeetingParticipants,
    updateMeeting: updateMeetingModel,
    deleteMeeting: deleteMeetingModel,
    getProjectUsers: getProjectUsersModel,
    getMeetingTypes: getMeetingTypesModel,
    confirmAttendance: confirmAttendanceModel,
    removeMeetingParticipants
} = require('../models/meetingModel');
const meetingService = require('../services/meetingService');
const { AppError } = require('../utils/errorHandler');
const { notify, NotificationTypes } = require('../services/notificationService');
const { getProjectById } = require('../models/projectModel');

const formatDate = (fecha) => {
    return new Date(fecha).toLocaleString('es-MX', {
        timeZone: 'America/Mexico_City', // <--- ¡Esto es clave!
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Crear nueva reunión
const createMeeting = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { participantes = [], ...meetingData } = req.body;

        console.log('📥 Datos recibidos para crear reunión:', { userId, ...meetingData, participantes });

        // Validaciones básicas
        if (!meetingData.titulo || !meetingData.fecha_hora_inicio || !meetingData.fecha_hora_fin) {
            console.error('❌ Faltan datos obligatorios para crear la reunión');
            throw new AppError('Título, fecha de inicio y fin son obligatorios', 400);
        }

        // Validar que la fecha de inicio no sea pasada
        const ahora = new Date();
        const fechaInicioDate = new Date(meetingData.fecha_hora_inicio);
        const fechaFinDate = new Date(meetingData.fecha_hora_fin);

        if (isNaN(fechaInicioDate.getTime()) || isNaN(fechaFinDate.getTime())) {
            throw new AppError('Las fechas proporcionadas no son válidas', 400);
        }
        if (fechaInicioDate <= ahora) {
            throw new AppError('La fecha de inicio debe ser en el futuro', 400);
        }
        if (fechaFinDate <= fechaInicioDate) {
            throw new AppError('La fecha de fin debe ser posterior a la fecha de inicio', 400);
        }

        meetingData.id_creador = userId;

        // Crear reunión
        const meetingId = await createMeetingModel(meetingData);
        console.log('✅ Reunión creada con ID:', meetingId);

        // Si hay participantes, agregar y notificar
        if (participantes.length > 0) {
            console.log('👥 Agregando participantes a la reunión:', participantes);

            await addMeetingParticipants(meetingId, participantes);
            console.log('✅ Participantes agregados correctamente');

            await meetingService.sendMeetingInvitations(meetingId, participantes);
            console.log('📨 Invitaciones a la reunión enviadas');

            // NOTIFICACIÓN
            let nombreProyecto = '';
            if (meetingData.id_proyecto) {
                console.log('🔍 Buscando nombre del proyecto para la notificación...');
                const proyecto = await getProjectById(meetingData.id_proyecto, userId, req.user.rol);
                if (proyecto) {
                    nombreProyecto = proyecto.nombre;
                    console.log('📄 Nombre del proyecto encontrado:', nombreProyecto);
                } else {
                    console.warn('⚠️ Proyecto no encontrado o no accesible');
                }
            }

            const fechaInicio = new Date(meetingData.fecha_hora_inicio);
            const fechaFin = new Date(meetingData.fecha_hora_fin);

            const fechaFormateada = `${formatDate(fechaInicio)} - ${fechaFin.toLocaleTimeString('es-MX', {
                timeZone: 'America/Mexico_City',
                hour: '2-digit',
                minute: '2-digit'
            })}`;


            await notify({
                tipo: NotificationTypes.REUNION_AGENDADA,
                destinatarios: participantes,
                parametros: {
                    tituloReunion: meetingData.titulo,
                    fecha: fechaFormateada,
                    nombreProyecto
                },
                enlaceAccion: `/reuniones/${meetingId}`
            });



            console.log('📢 Notificación de reunión agendada enviada correctamente');
        } else {
            console.log('ℹ️ Reunión sin participantes, no se enviaron notificaciones');
        }

        res.status(201).json({
            success: true,
            message: 'Reunión creada exitosamente',
            data: { id: meetingId }
        });

    } catch (error) {
        console.error('❌ Error en createMeeting:', error);
        next(error);
    }
};


// Obtener reuniones del usuario autenticado
const getMyMeetings = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const meetings = await getUserMeetings(userId);

        res.status(200).json({
            success: true,
            message: 'Reuniones obtenidas exitosamente',
            data: meetings
        });

    } catch (error) {
        next(error);
    }
};

// Obtener reuniones de un proyecto específico
const getProjectMeetings = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { projectId } = req.params;

        const meetings = await getProjectMeetingsModel(projectId, userId);

        res.status(200).json({
            success: true,
            message: 'Reuniones del proyecto obtenidas exitosamente',
            data: meetings
        });

    } catch (error) {
        next(error);
    }
};

// Obtener reunión por ID
const getMeetingById = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const meeting = await getMeetingByIdModel(id, userId);

        if (!meeting) {
            throw new AppError('Reunión no encontrada o no tienes acceso', 404);
        }

        // Obtener participantes
        const participants = await getMeetingParticipants(id);
        meeting.participantes = participants;

        res.status(200).json({
            success: true,
            message: 'Reunión obtenida exitosamente',
            data: meeting
        });

    } catch (error) {
        next(error);
    }
};

// Actualizar reunión
const updateMeeting = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { participantes = [], ...meetingData } = req.body;

        // Verificar que el usuario es el creador
        const meeting = await getMeetingByIdModel(id, userId);
        if (!meeting || !meeting.es_creador) {
            throw new AppError('No tienes permisos para actualizar esta reunión', 403);
        }

        // Actualizar reunión
        await updateMeetingModel(id, meetingData);

        // Actualizar participantes si se proporcionaron
        if (req.body.hasOwnProperty('participantes')) {
            await removeMeetingParticipants(id);
            if (participantes.length > 0) {
                await addMeetingParticipants(id, participantes);
            }
        }

        res.status(200).json({
            success: true,
            message: 'Reunión actualizada exitosamente'
        });

    } catch (error) {
        next(error);
    }
};

// Eliminar reunión
const deleteMeeting = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        // Verificar que el usuario es el creador
        const meeting = await getMeetingByIdModel(id, userId);
        if (!meeting || !meeting.es_creador) {
            throw new AppError('No tienes permisos para eliminar esta reunión', 403);
        }

        await deleteMeetingModel(id);

        res.status(200).json({
            success: true,
            message: 'Reunión eliminada exitosamente'
        });

    } catch (error) {
        next(error);
    }
};

// Obtener usuarios de un proyecto
const getProjectUsers = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const users = await getProjectUsersModel(projectId);

        res.status(200).json({
            success: true,
            message: 'Usuarios del proyecto obtenidos exitosamente',
            data: users
        });

    } catch (error) {
        next(error);
    }
};

// Obtener tipos de reunión
const getMeetingTypes = async (req, res, next) => {
    try {
        const types = await getMeetingTypesModel();

        res.status(200).json({
            success: true,
            message: 'Tipos de reunión obtenidos exitosamente',
            data: types
        });

    } catch (error) {
        next(error);
    }
};

// Confirmar asistencia
const confirmAttendance = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        await confirmAttendanceModel(id, userId);

        res.status(200).json({
            success: true,
            message: 'Asistencia confirmada exitosamente'
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    createMeeting,
    getMyMeetings,
    getProjectMeetings,
    getMeetingById,
    updateMeeting,
    deleteMeeting,
    getProjectUsers,
    getMeetingTypes,
    confirmAttendance
};