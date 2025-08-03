import { CreateUserParams, GetMenuParams, SignInParams } from "@/type";
import {
  Account,
  Avatars,
  Client,
  Databases,
  ID,
  Query,
  Storage,
} from "react-native-appwrite";

export const appwriteConfig = {
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!,
  platform: "com.adnan.foodordering",
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!,
  databaseId: "6879c0b0001aa291a2a5",
  bucketId: "6886d756000bc1e0c2f6",
  userCollectionId: "6879c1600028b45df0b9",
  categoriesCollectionId: "688491dd003a4591c99b",
  menuCollectionId: "688492c10007727ce321",
  customizationsCollectionId: "6886d47b003333d22554",
  menuCustomizationsCollectionId: "6886d60b0018dd37e3fd",
};

export const client = new Client();

client
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.projectId)
  .setPlatform(appwriteConfig.platform);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
const avatars = new Avatars(client);

// Fungsi untuk mengecek apakah ada session aktif
export const checkSession = async () => {
  try {
    const session = await account.getSession("current");
    return session;
  } catch (error) {
    return null;
  }
};

// Fungsi untuk logout
export const signOut = async () => {
  try {
    await account.deleteSession("current");
  } catch (error) {
    console.log("Error during logout:", error);
  }
};

export const createUser = async ({
  email,
  password,
  name,
}: CreateUserParams) => {
  try {
    const newAccount = await account.create(ID.unique(), email, password, name);
    if (!newAccount) throw Error;

    await signIn({ email, password });

    const avatarUrl = avatars.getInitialsURL(name);

    return await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      ID.unique(),
      { email, name, accountId: newAccount.$id, avatar: avatarUrl }
    );
  } catch (e) {
    throw new Error(e as string);
  }
};

export const signIn = async ({ email, password }: SignInParams) => {
  try {
    // Cek apakah sudah ada session aktif
    const existingSession = await checkSession();

    if (existingSession) {
      // Jika sudah ada session, hapus dulu session yang lama
      await signOut();
    }

    // Buat session baru
    const session = await account.createEmailPasswordSession(email, password);
    return session;
  } catch (e) {
    // Tangani error dengan lebih spesifik
    if (e instanceof Error) {
      if (
        e.message.includes(
          "creation of a session is prohibited when a session is active"
        )
      ) {
        // Jika error karena session sudah aktif, coba logout dulu lalu login ulang
        try {
          await signOut();
          const session = await account.createEmailPasswordSession(
            email,
            password
          );
          return session;
        } catch (retryError) {
          throw new Error(
            "Gagal login setelah mencoba logout. Silakan coba lagi."
          );
        }
      }
      throw new Error(e.message);
    }
    throw new Error("Terjadi kesalahan saat login");
  }
};

export const getCurrentUser = async () => {
  try {
    const currentAccount = await account.get();
    if (!currentAccount) {
      console.log("No current account found");
      return null;
    }

    const currentUser = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal("accountId", currentAccount.$id)]
    );

    if (!currentUser || currentUser.documents.length === 0) {
      console.log("No user document found for account:", currentAccount.$id);
      return null;
    }

    return currentUser.documents[0];
  } catch (e) {
    console.log("getCurrentUser error:", e);
    return null;
  }
};

export const getMenu = async ({ category, query }: GetMenuParams) => {
  try {
    const queries: string[] = [];

    if (category) queries.push(Query.equal("categories", category));
    if (query) queries.push(Query.search("name", query));

    const menus = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.menuCollectionId,
      queries
    );

    return menus.documents;
  } catch (e) {
    throw new Error(e as string);
  }
};

export const getCategories = async () => {
  try {
    const categories = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.categoriesCollectionId
    );

    return categories.documents;
  } catch (e) {
    throw new Error(e as string);
  }
};
