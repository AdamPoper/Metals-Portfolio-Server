import mysql2 from 'mysql2/promise';
import dotenv from 'dotenv';
import GenericEntity from '../entity/generic-entity';

dotenv.config();

export const pool = mysql2.createPool({
    host: 'localhost',
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: 'metal-portfolio'
});

export class Persistence {

    static async selectEntitiesByNamedQuery<T extends GenericEntity>(query: string, args?: Array<any>): Promise<Array<T>> {
        const [results] = await pool.execute(query, args);
        return results as T[];
    }

    static async selectEntityByNamedQuery<T extends GenericEntity>(query: string, args?: Array<any>): Promise<T> {
        const [results] = await pool.execute(query, args);
        return (results as T[])[0] as T;
    }

    static async selectEntitiesByNamedQueryPaged<T extends GenericEntity>(query: string, pageSize: number, pageNumber: number, args?: Array<any>): Promise<Array<T>> {
        const [results] = await pool.execute(query, args);
        const start = pageSize * pageNumber;
        const end = start + pageSize;
        return (results as T[]).slice(start, end);
    }

    static async selectEntityById<T extends GenericEntity>(className: string, id: number): Promise<T | null> {
        const query = `SELECT * FROM ${className} WHERE id = ?;`;
        const [results] = await pool.execute(query, [id]);
        return (results as T[])[0] as T;
    }

    static async persistEntity<T extends GenericEntity>(className: string, entity: Partial<T>): Promise<any> {
        const columns = Object.keys(entity);
        const values = Object.values(entity);

        const inserts = '(' + columns.join(', ') + ')';
        const insertCount = '(' + values.map(() => '?') + ')';

        const query = 'INSERT INTO ' + className + inserts + ' VALUES ' + insertCount;
        return await pool.execute(query, values);
    }

    static async persistEntities<T extends GenericEntity>(className: string, entities: Array<Partial<T>>): Promise<any> {
        if (entities.length === 0) {
            return new Promise((resolve, reject) => {
                resolve('No entities to persist');
            });
        }

        const columns = Object.keys(entities[0]);
        const values = new Array<unknown>();
        entities.forEach(e => {
            const objectValues = Object.values(e);
            values.push(...objectValues);
        })

        const insertColumns = '(' + columns.join(', ') + ')';
        const insertValues = entities.map(e => {
            const objectValues = Object.values(e);
            return '(' + objectValues.map(() => '?') + ')';
        }).toString();

        const query = 'INSERT INTO ' + className + insertColumns + ' VALUES ' + insertValues;
        return await pool.execute(query, values);
    }

    static async updateEntity<T extends GenericEntity>(className: string, entity: Partial<T>): Promise<any> {
        let query: string = `UPDATE ${className} SET `;
        const entityId = entity.id;
        delete entity.id;
        const params = Object.values(entity);
        const setClauses = Object.keys(entity).map(key => `${key} = ?`);

        params.push(entityId);
        query += setClauses.join(', ');
        query += ` WHERE id = ?;`;
        return await pool.execute(query, params);
    }

    static async deleteEntity<T extends GenericEntity>(className: string, id: number): Promise<T | null> {
        const row = await this.selectEntityById<T>(className, id);
        if (!row) {
            return null;
        }

        const query: string = `DELETE FROM ${className} WHERE id = ?;`;
        await pool.execute(query, [id]);
        return row;
    }
}