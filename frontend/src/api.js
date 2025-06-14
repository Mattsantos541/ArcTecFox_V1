import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);


export const fetchAssets = async () => {
  try {
    const { data, error } = await supabase.from("assets").select("*");
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("❌ Error fetching assets:", error);
    throw error;
  }
};


export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data.user;
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    
    localStorage.removeItem("supabase.auth.token");
    sessionStorage.clear();

    console.log("✅ User logged out successfully.");
  } catch (error) {
    console.error("❌ Sign-out error:", error.message);
    throw error;
  }
}



export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user || null;
  } catch (error) {
    console.error("❌ Error getting current user:", error.message);
    return null;
  }
}


export const fetchMetrics = async () => {
  try {
    const { data, error } = await supabase.from("metrics").select("*");
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("❌ Error fetching metrics:", error.message);
    throw error;
  }
};


export async function completeUserProfile(profileData) {
  try {
    const { data: user, error: userError } = await supabase.auth.getUser();
    if (userError || !user?.user) throw new Error("No authenticated user");

    
    let { data: existingCompany, error: companyError } = await supabase
      .from("companies")
      .select("id")
      .eq("name", profileData.company_name)
      .single();

    if (companyError && companyError.code !== "PGRST116") {
      throw new Error(`Error checking company: ${companyError.message}`);
    }

    let company_id = existingCompany?.id;

    
    if (!company_id) {
      const { data: newCompany, error: insertError } = await supabase
        .from("companies")
        .insert([
          {
            name: profileData.company_name,
            industry: profileData.industry,
            company_size: profileData.company_size,
          },
        ])
        .select("id")
        .single();

      if (insertError) throw new Error(`Error creating company: ${insertError.message}`);
      company_id = newCompany.id; 
    }

    
    const { data, error } = await supabase
      .from("users")
      .upsert({
        id: user.user.id,
        email: user.user.email,
        full_name: profileData.full_name,
        role: profileData.role,
        company_id: company_id, 
        industry: profileData.industry,
        company_size: profileData.company_size,
        company_name: profileData.company_name,
        updated_at: new Date().toISOString(),
        profile_completed: true,
      })
      .select("*")
      .single();

    if (error) {
      console.error("❌ Profile completion error:", error);
      throw new Error(error.message);
    }

    console.log("✅ Profile updated:", data);
    return data;
  } catch (error) {
    console.error("❌ Error in completeUserProfile:", error.message);
    throw error;
  }
}


export async function isProfileComplete(userId) {
  try {
    if (!userId) throw new Error("User ID is required to check profile status");

    const { data, error } = await supabase
      .from("users")
      .select("profile_completed")
      .eq("id", userId)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    return data?.profile_completed ?? false; 
  } catch (error) {
    console.error("❌ Error checking profile completion:", error.message);
    throw error;
  }
}
