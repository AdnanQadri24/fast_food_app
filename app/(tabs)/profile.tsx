import CustomButton from "@/components/CustomButton";
import { images } from "@/constants";
import useAuthStore from "@/store/auth.store";
import { router } from "expo-router";
import { Image, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Profile = () => {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.replace("/sign-in");
  };

  return (
    <SafeAreaView className="flex-1">
      <View className="flex-1 items-center justify-center p-5">
        <Image source={images.user} className="size-20" tintColor="#000000" />
        <Text className="font-bold text-xl mt-4">Profile</Text>

        {user && (
          <View className="mt-4 items-center">
            <Text className="text-lg font-semibold">{user.name}</Text>
            <Text className="text-gray-600">{user.email}</Text>
          </View>
        )}

        <View className="mt-8 w-full">
          <CustomButton
            title="Logout"
            onPress={handleLogout}
            containerStyles="bg-red-500"
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Profile;
