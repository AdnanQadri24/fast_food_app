import { images } from "@/constants";
import { Image, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Profile = () => {
  return (
    <SafeAreaView className="flex-1">
      <View className="flex-1 items-center justify-center">
        <Image source={images.user} className="size-20" tintColor="#000000" />
        <Text className="font-bold text-xl">Profile</Text>
        <Text className="text-red-500">*Feature Still Maintenance*</Text>
      </View>
    </SafeAreaView>
  );
};

export default Profile;
