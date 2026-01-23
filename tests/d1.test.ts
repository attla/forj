import { Model, BaseModel } from '@/d1'

import {
  array, object, string, number, date, optional,
  z, ZodTypeAny,
} from 'zod'

const user = object({
  id: number(),//string().uuid(),
  name: string().min(1),
  email: string().email(),
  created_at: date().or(string().datetime()),
  updated_at: date().or(string().datetime()),
})

const role = object({
  id: string(),
  name: string(),
  user_id: string(),
})

const Schema = object({
  users: user,
  roles: role,
})

class Role extends Model(Schema, 'users') {
}
const rolesOne = Role.select('name').on('id', 123).join('roles', 'id', '123').first()
const rolesAll = Role.select('name').on('id', 123).join('roles', 'id', '123').all()



////////////////////////////////////////////////////////////////////////////////

// import BaseModel from '@/d1/model'

// export interface IUser {
//   id: number
//   name: string
//   email: string
//   created_at: string
//   updated_at: string
// }
// export interface IRole {
//   id: number,
//   user_id: number,
// }

// interface Schema {
//   users: IUser
//   roles: IRole
// }

// // export default function makeClient<T>() {
// //   return {
// //     Model: BaseModel<DBSchema>,
// //     Seeder: Seeder<DBSchema>,
// //   }
// // }

// class User extends BaseModel<'users', DBSchema> {
//   // static db = 'shoop'
//   // static table = 'usuario'
//   // static table: string = 'usuario'
// }

// // .join('table', 'column', 'value')
// // .join('table', 'column', 'operador', 'value')
// // .join('table', 'column', 'table2', 'value2')
// // .join('table', 'column', operador', 'table2', 'value2')


// const roles = User.where('id', 1).join('roles', 'user_id', 132).select('id', 'name').first()

// // const roles2 = User.where('id', 1).join('roles', 'user_id', 'users', 'id').select('id').first()
// // const roles3 = User.where('id', 1).join('roles', 'user_id', 'users', 'id').select('id').all()

// // const user = User.where('id', 1).select('id', 'name').first()
// // console.log(User.where('id', 1))

// // describe('D1', () => {
// //   it('testing')
// // })
