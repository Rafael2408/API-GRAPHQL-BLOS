const { db } = require('../config/connection')

const blogResolver = { 
    Query: {
        comentarios(root, { id }) {
            if (id == undefined) {
                return db.any('SELECT * FROM comentario')
            } else {
                return db.any(`
                SELECT p.pub_titulo, a.aut_nombre, c.com_descripcion FROM 
                comentario c, publicacion p, autor a
                WHERE c.pub_id = p.pub_id AND c.aut_id = a.aut_id AND c.com_id = $1
            `, [id])
            }
        },
        publicaciones(root, { id }) {
            if (id == undefined) {
                return db.any('SELECT * FROM publicacion')
            } else {
                const res = db.any(`
                SELECT p.pub_id, p.pub_titulo, a.aut_usuario, p.pub_descripcion, c.com_descripcion FROM 
                comentario c, publicacion p, autor a
                WHERE c.pub_id = p.pub_id AND c.aut_id = a.aut_id AND p.pub_id = $1
                `, [id])
                return res
            }
        },
        autores(root, {id}){
            if (id == undefined) {
                return db.any('SELECT * FROM autor')
            } else {
                return db.any(`
                SELECT a.aut_id, a.aut_usuario, a.aut_nombre FROM 
                autor a
                WHERE a.aut_id = $1
            `, [id])
            }
        }
    },
    publicacion: {
        comentarios: async (publicacion) => {
            const res = await db.any(`
                SELECT c.com_id, c.pub_id, c.aut_id, c.com_descripcion, a.aut_nombre FROM 
                comentario c, autor a
                WHERE c.aut_id = a.aut_id AND c.pub_id = $1
            `, [publicacion.pub_id])
            return res
        },
        num_comentarios: async (publicacion) => {
            const res = await db.one(`
                SELECT COUNT(c.com_id) FROM 
                comentario c
                WHERE c.pub_id = $1
            `, [publicacion.pub_id])
            return res.count
        },
        categoria: async (publicacion) =>{
            return await db.one(`
                SELECT c.cat_id, c.cat_titulo FROM 
                categoria c
                WHERE c.cat_id = $1
            `, [publicacion.cat_id])
        }
    },
    autor:{
        publicaciones: async (autor) => {
            return await db.any(`
                SELECT a.aut_usuario, a.aut_nombre, p.pub_titulo, p.pub_descripcion, c.cat_titulo, c.cat_id
                FROM autor a, publicacion p, categoria c
                WHERE a.aut_id = p.aut_id AND c.cat_id = p.cat_id AND a.aut_id = $1 
            `, [autor.aut_id])
        },
        num_publicaciones: async (autor) => {
            const res = await db.one(`
                SELECT COUNT(p.pub_id) FROM
                publicacion p
                WHERE p.aut_id = $1
            `, [autor.aut_id])
            return res.count
        },
        num_likes: async(autor) =>{
            const res = await db.one(`
                SELECT COUNT(r.rea_like = TRUE) FROM 
                reaccion r, 
                WHERE r.aut_id = $1
            `, [autor.aut_id])
            return res.count
        }
    },
    comentario: {
        num_likes: async (comentario) =>{
            const res = await db.one(`
                SELECT COUNT(r.rea_like = TRUE) FROM 
                reaccion r, comentario c
                WHERE r.com_id = $1
            `, [comentario.com_id])
            return res.count
        }
    },

    Mutation: {
        async createComentario(root, { comentario }) {
            try {
                if (comentario == undefined) {
                    return null
                } else {
                    const newComentario = await db.one(`
                    INSERT INTO comentario(
                    com_descripcion, pub_id, aut_id)
                    VALUES ($1, $2, $3) RETURNING *;
                `, [comentario.com_descripcion, comentario.pub_id, comentario.aut_id])
                    return newComentario
                }
            } catch (error) {
                return { error: error.message }
            }
        },
        async updateComentario(root, { comentario }) {
            try {
                console.log(114, comentario)
                if (comentario == undefined) { 
                    return null
                } else {
                    const updateComentario = await db.one(`
                    UPDATE comentario SET
                    com_descripcion = $1,
                    pub_id = $2,
                    aut_id = $3
                    WHERE com_id = $4 RETURNING *;
                `, [comentario.com_descripcion, comentario.pub_id, comentario.aut_id, comentario.com_id])
                    return updateComentario
                }
            } catch (error) {
                return { error: error.message }
            }
        },
        async deleteComentario(root, { id }) {
            try {
                if (id == undefined) {
                    return null
                } else {
                    const deleteComentario = await db.one(`
                    DELETE FROM comentario
                    WHERE com_id = $1 RETURNING *;
                `, [id])
                    return deleteComentario
                }
            } catch (error) {
                return { error: error.message }
            }
        }
    }
}

module.exports = blogResolver