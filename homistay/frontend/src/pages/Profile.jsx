import React, { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { UserCircle, Mail, Phone, CalendarDays, Shield, FileText, User, Edit2, KeyRound, Save, X, Camera } from "lucide-react";
import { authApi } from "@/services/api";

export function ProfilePage() {
  const { user, setUser } = useAppContext();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Initialize form with current user values so fields are pre-filled
  const initFormData = () => ({
    fullName: user?.name || "",
    phone: user?.phone || "",
    bio: user?.bio || "",
    dob: user?.dob || "",
    gender: user?.gender || "",
    avatarUrl: user?.avatar || "",
  });
  const [formData, setFormData] = useState(initFormData);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [phoneError, setPhoneError] = useState("");

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-xl text-muted-foreground">Please log in to view your profile.</p>
      </div>
    );
  }

  const handleProfileChange = (e) => {
    let { name, value, files } = e.target;
    if (name === "avatarFile" && files?.length) {
      const file = files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      return;
    }
    if (name === "phone") {
      if (/[a-zA-Z]/.test(value)) {
        setPhoneError("Only numbers allowed");
      } else {
        setPhoneError("");
      }
      value = value.replace(/[^0-9+\s()-]/g, "");
    }
    setFormData({ ...formData, [name]: value });
  };
  const handlePasswordChange = (e) => setPasswordData({ ...passwordData, [e.target.name]: e.target.value });

  const handleSaveProfile = async () => {
    if (formData.phone && !/^[0-9+\s()-]{4,20}$/.test(formData.phone)) {
      setError("Please enter a valid phone number (4-20 digits/symbols).");
      return;
    }
    if (formData.dob) {
      const birthDate = new Date(formData.dob);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
      if (actualAge < 16) {
        setError("You must be at least 16 years old.");
        return;
      }
    }
    try {
      setLoading(true);
      setError("");

      const payload = {};
      if (formData.fullName !== (user.name || "")) payload.fullName = formData.fullName;
      if (formData.phone !== (user.phone || "")) payload.phone = formData.phone;
      if (formData.bio !== (user.bio || "")) payload.bio = formData.bio;
      if (formData.dob !== (user.dob || "")) payload.dob = formData.dob || null;
      if (formData.gender !== (user.gender || "")) payload.gender = formData.gender;

      const hasChanges = Object.keys(payload).length > 0;
      const hasFile = avatarFile !== null;

      if (!hasChanges && !hasFile) {
        setIsEditing(false);
        setLoading(false);
        return;
      }

      const formDataPayload = new FormData();
      const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
      formDataPayload.append("data", blob);
      if (hasFile) {
        formDataPayload.append("file", avatarFile);
      }

      await authApi.updateProfile(formDataPayload);
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!passwordRegex.test(passwordData.newPassword)) {
      setError("Password must be at least 8 characters with letters, numbers, and a symbol.");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    try {
      setLoading(true);
      setError("");
      await authApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setIsChangingPassword(false);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setSuccess("Password changed successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-background via-primary/5 to-muted/20 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header Section */}
        <div className="text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-serif font-bold text-primary tracking-tight">Your Profile</h1>
            <p className="text-muted-foreground mt-2 text-lg">Manage your account information and preferences</p>
          </div>
          <div className="flex gap-3 justify-center md:justify-end">
            {!isEditing && !isChangingPassword && (
              <>
                <button 
                  onClick={() => setIsChangingPassword(true)}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                >
                  <KeyRound className="w-4 h-4 mr-2" />
                  Change Password
                </button>
                <button 
                  onClick={() => { setFormData(initFormData()); setAvatarFile(null); setAvatarPreview(null); setIsEditing(true); setError(''); setPhoneError(''); }}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Profile
                </button>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-destructive/15 text-destructive p-4 rounded-lg border border-destructive/20 text-sm font-medium">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-500/15 text-green-600 p-4 rounded-lg border border-green-500/20 text-sm font-medium">
            {success}
          </div>
        )}
        
        {isChangingPassword ? (
          <div className="bg-card/80 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl rounded-3xl p-8 transition-all duration-300">
            <h3 className="text-xl font-semibold mb-6 flex items-center">
              <KeyRound className="w-6 h-6 mr-3 text-primary" />
              Change Password
            </h3>
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium mb-1">Current Password</label>
                <input 
                  type="password" 
                  name="currentPassword" 
                  value={passwordData.currentPassword} 
                  onChange={handlePasswordChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">New Password</label>
                <input 
                  type="password" 
                  name="newPassword" 
                  value={passwordData.newPassword} 
                  onChange={handlePasswordChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                <input 
                  type="password" 
                  name="confirmPassword" 
                  value={passwordData.confirmPassword} 
                  onChange={handlePasswordChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={handleChangePassword}
                  disabled={loading}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? "Saving..." : "Save Password"}
                </button>
                <button 
                  onClick={() => setIsChangingPassword(false)}
                  disabled={loading}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-card/80 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl rounded-3xl overflow-hidden flex flex-col md:flex-row transition-all duration-300">
            {/* Left Column - Avatar & Core Info */}
            <div className="md:w-1/3 relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-10 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-border/40">
              <div className="relative group">
                {isEditing ? (
                  <div className="w-40 h-40 rounded-full border-4 border-background shadow-xl mb-6 relative overflow-hidden bg-muted flex items-center justify-center">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : formData.avatarUrl ? (
                      <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <UserCircle className="w-20 h-20 text-muted-foreground/40" />
                    )}
                    <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera className="w-8 h-8 text-white" />
                      <input
                        type="file"
                        name="avatarFile"
                        accept="image/*"
                        onChange={handleProfileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  user.avatar || user.profilePic ? (
                    <img 
                      src={user.avatar || user.profilePic} 
                      alt={user.name} 
                      className="w-50 h-50 rounded-full object-cover border-4 border-background shadow-xl mb-6 transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-40 h-40 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 border-4 border-background shadow-xl transition-transform duration-500 group-hover:scale-105">
                      <UserCircle className="w-20 h-20 text-primary/40" />
                    </div>
                  )
                )}
              </div>
              
              {isEditing && (
                <div className="w-full mt-2 mb-6 space-y-1">
                  <label className="text-xs font-medium text-muted-foreground text-center block">
                    {avatarFile ? avatarFile.name : "Click camera icon to upload photo"}
                  </label>
                </div>
              )}
              
              {!isEditing && (
                <>
                
                  <h2 className="text-2xl font-bold mt-2 text-center text-foreground"></h2>
                  <div className="mt-4 inline-flex items-center px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold tracking-wide uppercase shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow">
                    <Shield className="w-4 h-4 mr-2" />
                    {user.role}
                  </div>
                  <br />
                <br />
                <br />
                <br />
                </>
              )}
            </div>
            
            {/* Right Column - Details */}
            <div className="md:w-2/3 p-8 sm:p-10 relative">
              {isEditing && (
                <div className="absolute top-6 right-6 flex gap-2">
                  <button 
                    onClick={() => { setFormData(initFormData()); setAvatarFile(null); setAvatarPreview(null); setIsEditing(false); setError(''); setPhoneError(''); }}
                    disabled={loading}
                    className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={handleSaveProfile}
                    disabled={loading}
                    className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-md"
                  >
                    <Save className="w-5 h-5" />
                  </button>
                </div>
              )}

              <h3 className="text-xl font-semibold border-b border-border/40 pb-4 mb-8 text-foreground/90 flex items-center">
                <UserCircle className="w-6 h-6 mr-3 text-primary/70" />
                Account Details
              </h3>
              
              <div className="grid gap-8 sm:grid-cols-2">
                
                <div className="flex items-start group">
                  <div className="p-3 rounded-2xl bg-primary/10 text-primary mr-4 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-sm">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Full Name</p>
                    {isEditing ? (
                      <input 
                        type="text" 
                        name="fullName" 
                        value={formData.fullName} 
                        onChange={handleProfileChange}
                        placeholder="Your full name"
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                    ) : (
                      <p className="text-base font-semibold">{user.name}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start group">
                  <div className="p-3 rounded-2xl bg-primary/10 text-primary mr-4 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-sm">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Email Address</p>
                    <p className="text-base font-semibold">{user.email}</p>
                    {isEditing && <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>}
                  </div>
                </div>
                
                <div className="flex items-start group">
                  <div className="p-3 rounded-2xl bg-primary/10 text-primary mr-4 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-sm">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Phone Number</p>
                    {isEditing ? (
                      <div>
                        <input 
                          type="tel" 
                          name="phone" 
                          value={formData.phone} 
                          onChange={handleProfileChange}
                          placeholder={user.phone || "Enter your phone number"}
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                        {phoneError && <p className="text-xs text-destructive mt-1">{phoneError}</p>}
                      </div>
                    ) : (
                      <p className="text-base font-semibold">{user.phone || "Not provided"}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-start group">
                  <div className="p-3 rounded-2xl bg-primary/10 text-primary mr-4 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-sm">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Date of Birth</p>
                    {isEditing ? (
                      <input 
                        type="date" 
                        name="dob" 
                        value={formData.dob} 
                        onChange={handleProfileChange}
                        placeholder={user.dob || "Select date of birth"}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                    ) : (
                      <p className="text-base font-semibold">
                        {user.dob 
                          ? new Date(user.dob).toLocaleDateString(undefined, { 
                              year: 'numeric', month: 'long', day: 'numeric' 
                            }) 
                          : "Not provided"}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start group">
                  <div className="p-3 rounded-2xl bg-primary/10 text-primary mr-4 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-sm">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Gender</p>
                    {isEditing ? (
                      <select 
                        name="gender" 
                        value={formData.gender} 
                        onChange={handleProfileChange}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      <p className="text-base font-semibold capitalize">{user.gender || "Not provided"}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bio Section */}
              <div className="mt-8 pt-8 border-t border-border/40">
                <div className="flex items-start group">
                  <div className="p-3 rounded-2xl bg-primary/10 text-primary mr-4 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-sm">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Bio</p>
                    {isEditing ? (
                      <textarea 
                        name="bio" 
                        value={formData.bio} 
                        onChange={handleProfileChange}
                        rows={4}
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                        placeholder={user.bio || "Tell us a little bit about yourself..."}
                      />
                    ) : (
                      <p className="text-base leading-relaxed text-foreground/80 bg-muted/30 p-4 rounded-xl border border-border/40">
                        {user.bio || "No bio provided yet. Add a little bit about yourself!"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              {isEditing && (
                <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-border/40">
                  <button 
                    onClick={() => { setFormData(initFormData()); setAvatarFile(null); setAvatarPreview(null); setIsEditing(false); setError(''); setPhoneError(''); }}
                    disabled={loading}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveProfile}
                    disabled={loading}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

