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
  const list = await databases.listDocuments(
    appwriteConfig.databaseId,
    collectionId
  );

  await Promise.all(
    list.documents.map((doc) =>
      databases.deleteDocument(appwriteConfig.databaseId, collectionId, doc.$id)
    )
  );
}

async function clearStorage(): Promise<void> {
  const list = await storage.listFiles(appwriteConfig.bucketId);

  await Promise.all(
    list.files.map((file) =>
      storage.deleteFile(appwriteConfig.bucketId, file.$id)
    )
  );
}

async function uploadImageToStorage(imageUrl: string) {
  try {
    console.log(`🌐 Fetching image from: ${imageUrl}`);
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch image. Status: ${response.status}`);
    }

    const blob = await response.blob();

    const fileObj = {
      name: imageUrl.split("/").pop() || `file-${Date.now()}.jpg`,
      type: "image/png", // Bisa disesuaikan jika tahu format
      size: blob.size,
      uri: imageUrl,
    };

    console.log(`📤 Uploading image: ${fileObj.name} (${blob.size} bytes)...`);

    const file = await storage.createFile(
      appwriteConfig.bucketId,
      ID.unique(),
      fileObj
    );

    const fileURL = storage.getFileViewURL(appwriteConfig.bucketId, file.$id);
    console.log(`✅ Image uploaded: ${fileURL}`);

    return fileURL;
  } catch (error) {
    console.error(`❌ Failed to upload image from: ${imageUrl}`, error);
    // Fallback ke placeholder agar proses tetap jalan
    return "https://via.placeholder.com/300.png";
  }
}

async function seed(): Promise<void> {
  try {
    console.log("🔄 Clearing old data...");
    await clearAll(appwriteConfig.categoriesCollectionId);
    await clearAll(appwriteConfig.customizationsCollectionId);
    await clearAll(appwriteConfig.menuCollectionId);
    await clearAll(appwriteConfig.menuCustomizationsCollectionId);
    await clearStorage();

    console.log("📂 Seeding Categories...");
    const categoryMap: Record<string, string> = {};
    for (const cat of data.categories) {
      console.log(`📁 Creating category: ${cat.name}`);
      const doc = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.categoriesCollectionId,
        ID.unique(),
        cat
      );
      categoryMap[cat.name] = doc.$id;
    }

    console.log("🔧 Seeding Customizations...");
    const customizationMap: Record<string, string> = {};
    for (const cus of data.customizations) {
      console.log(`🧩 Creating customization: ${cus.name}`);
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
      customizationMap[cus.name] = doc.$id;
    }

    console.log("🍔 Seeding Menu Items...");
    const menuMap: Record<string, string> = {};
    for (const item of data.menu) {
      console.log(`📦 Creating menu item: ${item.name}`);
      console.log(`🌐 Fetching image URL: ${item.image_url}`);

      const uploadedImage = await uploadImageToStorage(item.image_url);

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

      menuMap[item.name] = doc.$id;

      for (const cusName of item.customizations) {
        console.log(`🔗 Linking ${item.name} to customization ${cusName}`);
        await databases.createDocument(
          appwriteConfig.databaseId,
          appwriteConfig.menuCustomizationsCollectionId,
          ID.unique(),
          {
            menu: doc.$id,
            customizations: customizationMap[cusName],
          }
        );
      }
    }

    console.log("✅ Seeding complete.");
  } catch (error) {
    console.error("❌ Failed to seed the database.", error);
  }
}

export default seed;
