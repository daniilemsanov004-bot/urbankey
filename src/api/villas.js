import { supabase } from "../supabase"


export const getVilla = async (slug) => {

    const { data, error } = await supabase
        .from("villas")
        .select("*")
        .eq("slug", slug)
        .single()


    if (error) {
        console.error(error)
        return null
    }


    return data
}