@startuml
top to bottom direction
skinparam packageStyle rectangle
skinparam usecase {
    BackgroundColor White
    BorderColor Black
}
skinparam rectangle {
    BackgroundColor #FAFAFA
    BorderColor Black
}

' Actors
actor "Super Admin" as SA
actor "Admin" as AD
actor "User" as US

rectangle "Sistem Prediksi Siswa Berprestasi" {
    
    rectangle "Fitur Super Admin" as BoxSA #FFE4E1 {
        usecase "Menambah User (Register)" as UC_AddUser
        usecase "Input Data User" as UC_InputDataUser
        usecase "Melihat Daftar User" as UC_ViewUsers
        usecase "Mengedit User" as UC_EditUser
        usecase "Menghapus User" as UC_DeleteUser
    }
    
    rectangle "Fitur Admin" as BoxAD #E6F3FF {
        usecase "Membuat Model CART" as UC_CreateModel
        usecase "Upload Dataset" as UC_UploadDataset
        usecase "Menghapus Model" as UC_DeleteModel
    }
    
    rectangle "Fitur User" as BoxUS #E8F5E9 {
        usecase "Login" as UC_Login
        usecase "Input Username" as UC_InputUsername
        usecase "Input Password" as UC_InputPassword
        usecase "Logout" as UC_Logout
        usecase "Melihat Dashboard" as UC_Dashboard
        usecase "Edit Profil" as UC_EditProfile
        usecase "Input Data Profil" as UC_InputProfil
        usecase "Melihat Daftar Model" as UC_ViewModels
        usecase "Download Template CSV" as UC_DownloadTemplate
        usecase "Melakukan Prediksi Tunggal" as UC_SinglePred
        usecase "Input Data Siswa" as UC_InputDataSiswa
        usecase "Melakukan Prediksi Batch" as UC_BatchPred
        usecase "Upload File CSV" as UC_UploadCSV
        usecase "Download Hasil Prediksi" as UC_DownloadResult
    }
}

' Super Admin connections (warna merah)
SA -[#DC143C]-> UC_AddUser
SA -[#DC143C]-> UC_ViewUsers
SA -[#DC143C]-> UC_EditUser
SA -[#DC143C]-> UC_DeleteUser

' Admin connections (warna biru)
AD -[#1E90FF]-> UC_CreateModel
AD -[#1E90FF]-> UC_DeleteModel

' User connections (warna hijau)
US -[#228B22]-> UC_Login
US -[#228B22]-> UC_Logout
US -[#228B22]-> UC_EditProfile
US -[#228B22]-> UC_Dashboard
US -[#228B22]-> UC_ViewModels
US -[#228B22]-> UC_DownloadTemplate
US -[#228B22]-> UC_SinglePred
US -[#228B22]-> UC_BatchPred
US -[#228B22]-> UC_DownloadResult

' <<include>> relationships (wajib dilakukan) - warna ungu
UC_Login .[#9932CC].> UC_InputUsername : <<include>>
UC_Login .[#9932CC].> UC_InputPassword : <<include>>
UC_CreateModel .[#9932CC].> UC_UploadDataset : <<include>>
UC_BatchPred .[#9932CC].> UC_UploadCSV : <<include>>
UC_SinglePred .[#9932CC].> UC_InputDataSiswa : <<include>>
UC_EditProfile .[#9932CC].> UC_InputProfil : <<include>>
UC_AddUser .[#9932CC].> UC_InputDataUser : <<include>>

' <<extend>> relationships (opsional) - warna oranye
UC_DownloadResult .[#FF8C00].> UC_SinglePred : <<extend>>
UC_DownloadResult .[#FF8C00].> UC_BatchPred : <<extend>>
UC_DownloadTemplate .[#FF8C00].> UC_CreateModel : <<extend>>
UC_EditUser .[#FF8C00].> UC_ViewUsers : <<extend>>
UC_DeleteUser .[#FF8C00].> UC_ViewUsers : <<extend>>
UC_DeleteModel .[#FF8C00].> UC_ViewModels : <<extend>>

' Admin inherits User features (warna biru)
AD -[#1E90FF]-> UC_Login
AD -[#1E90FF]-> UC_Logout
AD -[#1E90FF]-> UC_EditProfile
AD -[#1E90FF]-> UC_Dashboard
AD -[#1E90FF]-> UC_ViewModels
AD -[#1E90FF]-> UC_DownloadTemplate
AD -[#1E90FF]-> UC_SinglePred
AD -[#1E90FF]-> UC_BatchPred
AD -[#1E90FF]-> UC_DownloadResult

' Super Admin inherits Admin features (warna merah)
SA -[#DC143C]-> UC_Login
SA -[#DC143C]-> UC_Logout
SA -[#DC143C]-> UC_EditProfile
SA -[#DC143C]-> UC_Dashboard
SA -[#DC143C]-> UC_ViewModels
SA -[#DC143C]-> UC_CreateModel
SA -[#DC143C]-> UC_DeleteModel
SA -[#DC143C]-> UC_DownloadTemplate
SA -[#DC143C]-> UC_SinglePred
SA -[#DC143C]-> UC_BatchPred
SA -[#DC143C]-> UC_DownloadResult

@enduml