import { StyleSheet, Dimensions } from "react-native";
const { width } = Dimensions.get("window");

export default StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center", // FULL CENTER
    alignItems: "center",
    paddingHorizontal: 24,
    backgroundColor: "#FFFFFF",
  },

  illustration: {
    width: width * 0.7,
    height: width * 0.7,
    resizeMode: "contain",
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 10,
    color: "#222",
  },

  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
    marginTop: 6,
    marginBottom: 20,
  },

  input: {
    width: "100%",
    backgroundColor: "#F3F3F3",
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    marginTop: 15,
  },

  button: {
    width: "100%",
    backgroundColor: "#FF7B3F",
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 20,
    alignItems: "center",
  },

  buttonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
  },

  choicePill: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#F3F3F3",
    alignItems: "center",
    marginTop: 12,
  },

  choiceSelected: {
    backgroundColor: "#FFE6D7",
    borderWidth: 1,
    borderColor: "#FF7B3F",
  },

  choiceText: {
    fontSize: 17,
    color: "#444",
  },

  interestChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#F2F2F2",
    marginRight: 10,
    marginBottom: 10,
  },

  interestChipActive: {
    backgroundColor: "#FF7B3F",
  },

  interestText: {
    fontSize: 14,
    color: "#444",
  },

  interestTextActive: {
    color: "#FFF",
  },

  categoryTitle: {
    marginTop: 15,
    marginBottom: 5,
    fontWeight: "700",
    color: "#222",
  },

  genderCard: {
  width: "100%",
  paddingVertical: 18,
  borderRadius: 14,
  borderWidth: 1.5,
  borderColor: "#FFD5B5",
  backgroundColor: "#FFF5EE",
  alignItems: "center",
  marginBottom: 15,
},

genderCardActive: {
  backgroundColor: "#FFE8D9",
  borderColor: "#FF9A63",
  shadowColor: "#FF9A63",
  shadowOpacity: 0.25,
  shadowRadius: 6,
  elevation: 3,
},

genderText: {
  fontSize: 18,
  color: "#444",
  fontWeight: "600",
},

genderTextActive: {
  color: "#FF6F3C",
  fontWeight: "700",
},

});


