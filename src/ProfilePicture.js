import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./ProfilePicture.css";

function ProfilePicture() {
  const [imageUrl, setImageUrl] = useState(localStorage.getItem("profileImage") || "");
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const fileInputRef = useRef(null);

  const name = localStorage.getItem("name") || "Unknown User";
  const email = localStorage.getItem("email") || "No email available";
  const role = localStorage.getItem("role") || "N/A";

  // ✅ Fetch user image from DB (optional, in case it's not in localStorage)
  useEffect(() => {
    const fetchProfileImage = async () => {
      const token = localStorage.getItem("token");
      console.log("Token:", token);
      if (!token) return;

      try {
        const res = await axios.get("https://system-backend-2-ty55.onrender.com/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.profile_image) {
          setImageUrl(res.data.profile_image);
          localStorage.setItem("profileImage", res.data.profile_image);
        }
      } catch (err) {
        console.error("Failed to fetch profile image:", err.message);
      }
    };

    if (!imageUrl) fetchProfileImage();
  }, []);

  const handleClick = () => setShowModal(true);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("profile", file);

      const res = await axios.post("https://system-backend-2-ty55.onrender.com/upload-profile", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      setImageUrl(res.data.imageUrl);
      localStorage.setItem("profileImage", res.data.imageUrl);
      alert("✅ Profile photo updated successfully!");
    } catch (err) {
      console.error("Upload failed:", err.response?.data || err.message);
      alert("❌ Upload failed!");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => setShowModal(false);

  return (
    <div className="profile-container">
      {/* Profile Image */}
      <img
        src={imageUrl || "/default-avatar.png"}
        alt="Profile"
        className="profile-pic"
        onClick={handleClick}
      />

      {/* Hidden File Input */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {/* Profile Modal */}
      {showModal && (
        <div className="profile-modal-overlay" onClick={handleClose}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <img
              src={imageUrl || "/default-avatar.png"}
              alt="Profile Large"
              className="profile-large"
              onClick={() => fileInputRef.current.click()}
              title="Click to change photo"
            />
            {uploading && <p>Uploading...</p>}
            <h3>{name}</h3>
            <p><strong>Email:</strong> {email}</p>
            <p><strong>Role:</strong> {role}</p>
            <button className="close-btn" onClick={handleClose}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfilePicture;
