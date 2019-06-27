import { extname } from "path"
import { ressourceToPathname } from "./to-pathname.js"

export const ressourceToExtension = (ressource) => extname(ressourceToPathname(ressource)).slice(1)
