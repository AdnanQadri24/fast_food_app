import { ID } from "react-native-appwrite";
import { appwriteConfig, databases, storage } from "./appwrite";
import dummyData from "./data";

interface Category {
  name: string;
  description: string;
}

interface Customization {
  name: string;
  price: number;
  type: "topping" | "side" | "size" | "crust" | string;
}

interface MenuItem {
  name: string;
  description: string;
  image_url: string;
  price: number;
  rating: number;
  calories: number;
  protein: number;
  category_name: string;
  customizations: string[];
}

interface DummyData {
  categories: Category[];
  customizations: Customization[];
  menu: MenuItem[];
}

const data = dummyData as DummyData;

async function clearAll(collectionId: string): Promise<void> {
  console.log(`🗑️ Clearing collection: ${collectionId}`);
  const list = await databases.listDocuments(
    appwriteConfig.databaseId,
    collectionId
  );
  console.log(
    `Found ${list.documents.length} documents in collection ${collectionId}`
  );

  await Promise.all(
    list.documents.map((doc) => {
      console.log(
        `Deleting document ID: ${doc.$id} from collection ${collectionId}`
      );
      return databases.deleteDocument(
        appwriteConfig.databaseId,
        collectionId,
        doc.$id
      );
    })
  );
  console.log(`✅ Cleared collection: ${collectionId}`);
}

async function clearStorage(): Promise<void> {
  console.log("🗑️ Clearing storage bucket");
  const list = await storage.listFiles(appwriteConfig.bucketId);
  console.log(
    `Found ${list.files.length} files in bucket ${appwriteConfig.bucketId}`
  );

  await Promise.all(
    list.files.map((file) => {
      console.log(
        `Deleting file ID: ${file.$id} from bucket ${appwriteConfig.bucketId}`
      );
      return storage.deleteFile(appwriteConfig.bucketId, file.$id);
    })
  );
  console.log("✅ Cleared storage bucket");
}

async function uploadImageToStorage(imageUrl: string) {
  try {
    console.log(`📤 Uploading image: ${imageUrl}`);

    // Tambahkan timeout dan error handling untuk fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 detik timeout

    const response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AppwriteBot/1.0)",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();

    // Validasi blob
    if (blob.size === 0) {
      throw new Error("Downloaded image is empty");
    }

    const fileObj = {
      name: imageUrl.split("/").pop() || `file-${Date.now()}.jpg`,
      type: blob.type || "image/png", // fallback type
      size: blob.size,
      uri: imageUrl,
    };
    console.log(`Prepared file object:`, fileObj);

    const file = await storage.createFile(
      appwriteConfig.bucketId,
      ID.unique(),
      fileObj
    );
    console.log(`Uploaded file ID: ${file.$id}`);

    const fileUrl = storage.getFileViewURL(appwriteConfig.bucketId, file.$id);
    console.log(`Generated file URL: ${fileUrl}`);
    return fileUrl;
  } catch (error) {
    console.error(`❌ Failed to upload image: ${imageUrl}`, error);

    // Fallback: gunakan URL asli jika upload gagal
    console.log(`�� Using original URL as fallback: ${imageUrl}`);
    return imageUrl;
  }
}

async function seed(): Promise<void> {
  console.log("🚀 Starting seeding process");

  // 1. Clear all
  console.log("Clearing all collections and storage...");
  await clearAll(appwriteConfig.categoriesCollectionId);
  await clearAll(appwriteConfig.customizationsCollectionId);
  await clearAll(appwriteConfig.menuCollectionId);
  await clearAll(appwriteConfig.menuCustomizationsCollectionId);
  await clearStorage();

  // 2. Create Categories
  console.log("📋 Creating categories...");
  const categoryMap: Record<string, string> = {};
  for (const cat of data.categories) {
    console.log(`Creating category: ${cat.name}`);
    const doc = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.categoriesCollectionId,
      ID.unique(),
      cat
    );
    console.log(`Created category ID: ${doc.$id} for ${cat.name}`);
    categoryMap[cat.name] = doc.$id;
  }

  // 3. Create Customizations
  console.log("🛠️ Creating customizations...");
  const customizationMap: Record<string, string> = {};
  for (const cus of data.customizations) {
    console.log(
      `Creating customization: ${cus.name} (Type: ${cus.type}, Price: ${cus.price})`
    );
    const doc = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.customizationsCollectionId,
      ID.unique(),
      {
        name: cus.name,
        price: cus.price,
        type: cus.type,
      }
    );
    console.log(`Created customization ID: ${doc.$id} for ${cus.name}`);
    customizationMap[cus.name] = doc.$id;
  }

  // 4. Create Menu Items
  console.log("🍕 Creating menu items...");
  const menuMap: Record<string, string> = {};
  for (const item of data.menu) {
    console.log(`Processing menu item: ${item.name}`);
    const uploadedImage = await uploadImageToStorage(item.image_url);

    console.log(
      `Creating menu item: ${item.name} with category ${item.category_name}`
    );
    const doc = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.menuCollectionId,
      ID.unique(),
      {
        name: item.name,
        description: item.description,
        image_url: uploadedImage,
        price: item.price,
        rating: item.rating,
        calories: item.calories,
        protein: item.protein,
        categories: categoryMap[item.category_name],
      }
    );
    console.log(`Created menu item ID: ${doc.$id} for ${item.name}`);
    menuMap[item.name] = doc.$id;

    // 5. Create menu_customizations
    console.log(`Associating customizations for menu item: ${item.name}`);
    for (const cusName of item.customizations) {
      console.log(
        `Linking customization: ${cusName} to menu item: ${item.name}`
      );
      await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.menuCustomizationsCollectionId,
        ID.unique(),
        {
          menu: doc.$id,
          customizations: customizationMap[cusName],
        }
      );
      console.log(
        `Linked customization ${cusName} to menu item ID: ${doc.$id}`
      );
    }
  }

  console.log("✅ Seeding complete.");
}

export default seed;
