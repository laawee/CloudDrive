import React, { useState, useEffect } from 'react';
import COS from 'cos-js-sdk-v5';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { File, Folder, Home, Plus, Search, Settings, Upload } from "lucide-react";

const cos = new COS({
  SecretId: process.env.NEXT_PUBLIC_COS_SECRET_ID,
  SecretKey: process.env.NEXT_PUBLIC_COS_SECRET_KEY,
});

export default function CloudStorageDashboard() {
  const [files, setFiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPath, setCurrentPath] = useState('/');

  useEffect(() => {
    fetchFiles();
  }, [currentPath]);

  const fetchFiles = () => {
    cos.getBucket({
      Bucket: process.env.NEXT_PUBLIC_COS_BUCKET,
      Region: process.env.NEXT_PUBLIC_COS_REGION,
      Prefix: currentPath,
      Delimiter: '/'
    }, (err, data) => {
      if (err) {
        console.error('Error fetching files:', err);
      } else {
        const formattedFiles = [
          ...data.CommonPrefixes.map(prefix => ({
            name: prefix.Prefix.split('/').slice(-2)[0],
            type: 'folder',
            size: '-',
            lastModified: '-'
          })),
          ...data.Contents.map(file => ({
            name: file.Key.split('/').pop(),
            type: 'file',
            size: formatFileSize(file.Size),
            lastModified: new Date(file.LastModified).toLocaleDateString()
          }))
        ];
        setFiles(formattedFiles);
      }
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      cos.putObject({
        Bucket: process.env.NEXT_PUBLIC_COS_BUCKET,
        Region: process.env.NEXT_PUBLIC_COS_REGION,
        Key: currentPath + file.name,
        Body: file
      }, (err, data) => {
        if (err) {
          console.error('Error uploading file:', err);
        } else {
          console.log('File uploaded successfully');
          fetchFiles();
        }
      });
    }
  };

  const handleCreateFolder = () => {
    const folderName = prompt('Enter folder name:');
    if (folderName) {
      cos.putObject({
        Bucket: process.env.NEXT_PUBLIC_COS_BUCKET,
        Region: process.env.NEXT_PUBLIC_COS_REGION,
        Key: currentPath + folderName + '/',
        Body: ''
      }, (err, data) => {
        if (err) {
          console.error('Error creating folder:', err);
        } else {
          console.log('Folder created successfully');
          fetchFiles();
        }
      });
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFileAction = (file) => {
    if (file.type === 'folder') {
      setCurrentPath(currentPath + file.name + '/');
    } else {
      // For files, initiate download
      cos.getObjectUrl({
        Bucket: process.env.NEXT_PUBLIC_COS_BUCKET,
        Region: process.env.NEXT_PUBLIC_COS_REGION,
        Key: currentPath + file.name,
        Sign: true
      }, (err, data) => {
        if (err) {
          console.error('Error getting file URL:', err);
        } else {
          window.open(data.Url, '_blank');
        }
      });
    }
  };

  return (
    
      {/* Sidebar */}
      
        
          CloudDrive
        
        
          
            
            我的文件
          
          
            
            共享文件
          
          
            
            设置
          
        
      
      {/* Main Content */}
      
        
          我的文件
          
            <Button variant="outline" onClick={() => document.getElementById('fileInput').click()}>
              
              上传
            
            
            
              
              新建文件夹
            
          
        
        
          }
            value={searchTerm}
            onChange={handleSearch}
          />
        
        
          
            
              名称
              大小
              修改日期
              操作
            
          
          
            {filteredFiles.map((file, index) => (
              
                
                  
                    {file.type === 'folder' ? (
                      
                    ) : (
                      
                    )}
                    {file.name}
                  
                
                {file.size}
                {file.lastModified}
                
                  <Button variant="ghost" size="sm" onClick={() => handleFileAction(file)}>
                    {file.type === 'folder' ? '查看' : '下载'}
                  
                
              
            ))}
          
        
      
    
  );
}
```
